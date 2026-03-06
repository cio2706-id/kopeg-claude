import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, loanBalances, monthlyDeductions } from "@/lib/db/schema";
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

    // Get actual monthly deduction from potongan data (most accurate source)
    // Sum pinjamanAmount from the latest period across all source files
    const deductionRows = await db
      .select({
        period: monthlyDeductions.period,
        totalPinjaman: sql<string>`sum(${monthlyDeductions.pinjamanAmount})`,
      })
      .from(monthlyDeductions)
      .where(eq(monthlyDeductions.userId, dbUser.id))
      .groupBy(monthlyDeductions.period)
      .orderBy(sql`${monthlyDeductions.period} DESC`)
      .limit(1);

    const actualMonthlyDeduction = deductionRows.length > 0
      ? parseFloat(deductionRows[0].totalPinjaman || "0")
      : 0;
    const deductionPeriod = deductionRows.length > 0 ? deductionRows[0].period : null;

    // Group by loan type
    const pinjamanByType: Record<string, number> = {};
    let totalPinjaman = 0;
    let loanBalanceInstallment = 0; // from loanBalances.monthlyInstallment if set
    let estimatedInstallment = 0; // fallback: saldo / assumed tenor

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

        // Use actual monthlyInstallment from Excel if available
        if (lb.monthlyInstallment) {
          loanBalanceInstallment += parseFloat(lb.monthlyInstallment);
        } else {
          // Fallback: estimate from saldo / tenor (skip channeling)
          const baseType = lb.loanType.startsWith("channeling") ? "channeling" : lb.loanType;
          const tenor = ESTIMATED_TENOR[baseType];
          if (tenor) {
            estimatedInstallment += Math.ceil(saldo / tenor);
          }
        }
      }
    }

    // Priority: actualMonthlyDeduction (potongan) > loanBalanceInstallment (Excel angsuran) > estimatedInstallment (saldo/tenor)
    const bestInstallment = actualMonthlyDeduction > 0
      ? actualMonthlyDeduction
      : (loanBalanceInstallment > 0 ? loanBalanceInstallment : estimatedInstallment);

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
        estimatedMonthlyInstallment: bestInstallment,
        installmentSource: actualMonthlyDeduction > 0
          ? "potongan"
          : (loanBalanceInstallment > 0 ? "excel_angsuran" : "estimated"),
        deductionPeriod,
      },
    });
  } catch (error) {
    console.error("Failed to fetch member balances:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
