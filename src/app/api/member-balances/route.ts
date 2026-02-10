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

    // Group by loan type
    const pinjamanByType: Record<string, number> = {};
    let totalPinjaman = 0;
    for (const lb of loanBals) {
      const saldo = parseFloat(lb.saldo || "0");
      if (saldo > 0) {
        pinjamanByType[lb.loanType] = (pinjamanByType[lb.loanType] || 0) + saldo;
        totalPinjaman += saldo;
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch member balances:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
