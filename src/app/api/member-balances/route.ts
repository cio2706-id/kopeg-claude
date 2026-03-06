import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, loanBalances } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);

    // Get latest savings record
    const [latestSavings] = await db
      .select()
      .from(savings)
      .where(eq(savings.userId, dbUser.id))
      .orderBy(sql`${savings.period} DESC`)
      .limit(1);

    // Get all loan balances
    const loanBals = await db
      .select()
      .from(loanBalances)
      .where(eq(loanBalances.userId, dbUser.id));

    // Group by loan type and estimate monthly installments
    const pinjamanByType: Record<string, number> = {};
    let totalPinjaman = 0;
    let estimatedSaldoInstallment = 0;

    // Default tenor assumptions per loan type for installment estimation
    // Based on analysis of actual kartu pinjaman Excel files:
    // - Reguler: 10 months, flat principal (no interest in installment)
    // - Khusus: varies (10-60 months), use 24 as middle estimate
    // - Barang: varies (3-36 months), typically 10 months flat principal
    // - Channeling: handled by bank, excluded from installment calculation
    const ESTIMATED_TENOR: Record<string, number> = {
      reguler: 10,
      khusus: 24,
      barang: 10,
    };

    for (const lb of loanBals) {
      const saldo = parseFloat(lb.saldo || "0");
      if (saldo > 0) {
        pinjamanByType[lb.loanType] = (pinjamanByType[lb.loanType] || 0) + saldo;
        totalPinjaman += saldo;

        // Estimate monthly installment from remaining saldo
        // Skip channeling types (handled by bank, not deducted from salary)
        const baseType = lb.loanType.startsWith("channeling") ? "channeling" : lb.loanType;
        const tenor = ESTIMATED_TENOR[baseType];
        if (tenor) {
          estimatedSaldoInstallment += Math.ceil(saldo / tenor);
        }
      }
    }

    return NextResponse.json({
      simpanan: latestSavings ? {
        period: latestSavings.period,
        wajib: latestSavings.simpananWajib,
        pokok: latestSavings.simpananPokok,
        khusus: latestSavings.simpananKhusus,
        sukarela: latestSavings.simpananSukarela,
        shu: latestSavings.shu,
        total: latestSavings.totalBalance,
      } : null,
      pinjaman: {
        byType: pinjamanByType,
        total: totalPinjaman,
        estimatedMonthlyInstallment: estimatedSaldoInstallment,
      },
    });
  } catch (error) {
    console.error("Failed to fetch member balances:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
