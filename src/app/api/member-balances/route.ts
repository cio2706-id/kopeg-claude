import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, loanBalances, monthlyDeductions, loans } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, sql, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);

    console.log("[member-balances] userId:", dbUser.id, "email:", authUser.email, "fullName:", dbUser.fullName);

    // Get latest savings record
    const [latestSavings] = await db
      .select()
      .from(savings)
      .where(eq(savings.userId, dbUser.id))
      .orderBy(sql`${savings.period} DESC`)
      .limit(1);

    // Get all loan balances (from Excel imports + auto-disbursement)
    const loanBals = await db
      .select()
      .from(loanBalances)
      .where(eq(loanBalances.userId, dbUser.id));

    // Also get disbursed loans from the loans table (only dicairkan)
    // Pinjaman in process (not yet disbursed) should NOT count toward saldo
    const disbursedLoans = await db
      .select({
        loanType: loans.loanType,
        amount: loans.amount,
        tenorMonths: loans.tenorMonths,
        monthlyInstallment: loans.monthlyInstallment,
      })
      .from(loans)
      .where(
        and(
          eq(loans.userId, dbUser.id),
          inArray(loans.status, ["disbursed", "selesai"])
        )
      );

    // Get actual monthly deduction from potongan data (most accurate source)
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

    // Debug: count total loanBalances records in the whole DB
    const [totalLoanBalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loanBalances);

    console.log("[member-balances] userId:", dbUser.id, "loanBals for user:", loanBals.length, "total loanBals in DB:", totalLoanBalCount?.count, "disbursedLoans:", disbursedLoans.length);
    if (loanBals.length > 0) {
      console.log("[member-balances] loanBals details:", loanBals.map(lb => ({ type: lb.loanType, saldo: lb.saldo, period: lb.period })));
    }

    // Group by loan type from loanBalances
    const pinjamanByType: Record<string, number> = {};
    let totalPinjaman = 0;
    let loanBalanceInstallment = 0;
    let estimatedInstallment = 0;

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

        if (lb.monthlyInstallment) {
          loanBalanceInstallment += parseFloat(lb.monthlyInstallment);
        } else {
          const baseType = lb.loanType.startsWith("channeling") ? "channeling" : lb.loanType;
          const tenor = ESTIMATED_TENOR[baseType];
          if (tenor) {
            estimatedInstallment += Math.ceil(saldo / tenor);
          }
        }
      }
    }

    // Also aggregate from disbursed loans table (in case loanBalances wasn't updated)
    // This ensures newly disbursed loans always show up on dashboard
    const disbursedByType: Record<string, number> = {};
    for (const dl of disbursedLoans) {
      const amount = parseFloat(dl.amount || "0");
      if (amount > 0) {
        disbursedByType[dl.loanType] = (disbursedByType[dl.loanType] || 0) + amount;
      }
    }

    // Merge: use the higher value between loanBalances and disbursed loans per type
    // This handles both imported data and newly disbursed loans
    const allTypes = new Set([...Object.keys(pinjamanByType), ...Object.keys(disbursedByType)]);
    const mergedByType: Record<string, number> = {};
    let mergedTotal = 0;
    for (const type of allTypes) {
      const fromBalance = pinjamanByType[type] || 0;
      const fromLoans = disbursedByType[type] || 0;
      const best = Math.max(fromBalance, fromLoans);
      mergedByType[type] = best;
      mergedTotal += best;
    }

    // Priority: actualMonthlyDeduction (potongan) > loanBalanceInstallment (Excel angsuran) > estimatedInstallment (saldo/tenor)
    const bestInstallment = actualMonthlyDeduction > 0
      ? actualMonthlyDeduction
      : (loanBalanceInstallment > 0 ? loanBalanceInstallment : estimatedInstallment);

    // Build detailed loan balances list for loans page
    const loanBalanceDetails = loanBals
      .filter((lb) => parseFloat(lb.saldo || "0") > 0)
      .map((lb) => ({
        id: lb.id,
        loanType: lb.loanType,
        period: lb.period,
        saldo: lb.saldo,
        monthlyInstallment: lb.monthlyInstallment,
      }));

    return NextResponse.json({
      _debug: {
        userId: dbUser.id,
        userEmail: authUser.email,
        userFullName: dbUser.fullName,
        loanBalancesForUser: loanBals.length,
        totalLoanBalancesInDB: totalLoanBalCount?.count || 0,
        disbursedLoansCount: disbursedLoans.length,
        deductionRows: deductionRows.length,
      },
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
        byType: mergedByType,
        total: mergedTotal,
        estimatedMonthlyInstallment: bestInstallment,
        installmentSource: actualMonthlyDeduction > 0
          ? "potongan"
          : (loanBalanceInstallment > 0 ? "excel_angsuran" : "estimated"),
        deductionPeriod,
      },
      loanBalanceDetails,
    });
  } catch (error) {
    console.error("Failed to fetch member balances:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
