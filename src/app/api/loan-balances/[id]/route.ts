import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanBalances, users, monthlyDeductions } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, sql } from "drizzle-orm";

const INTEREST_RATES: Record<string, number> = {
  reguler: 12,
  khusus: 10,
  barang: 8,
  travel: 10,
  kepemilikan_kendaraan: 8,
  channeling_mandiri: 0,
  channeling_bsi: 0,
  channeling: 0,
};

const ESTIMATED_TENOR: Record<string, number> = {
  reguler: 10,
  khusus: 24,
  barang: 10,
  travel: 12,
  kepemilikan_kendaraan: 36,
  channeling_mandiri: 60,
  channeling_bsi: 60,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);
    const { id } = await params;

    // Fetch the loan balance record
    const [loanBalance] = await db
      .select()
      .from(loanBalances)
      .where(eq(loanBalances.id, id));

    if (!loanBalance) {
      return NextResponse.json({ error: "Loan balance not found" }, { status: 404 });
    }

    // Ensure the member can only view their own data
    if (loanBalance.userId !== dbUser.id && dbUser.role === "member") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch user info
    const [owner] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
        department: users.department,
        employeeId: users.employeeId,
      })
      .from(users)
      .where(eq(users.id, loanBalance.userId));

    const saldo = parseFloat(loanBalance.saldo || "0");
    const baseType = loanBalance.loanType.startsWith("channeling") ? "channeling" : loanBalance.loanType;
    const interestRate = INTEREST_RATES[loanBalance.loanType] ?? INTEREST_RATES[baseType] ?? 0;
    const estimatedTenor = ESTIMATED_TENOR[loanBalance.loanType] ?? ESTIMATED_TENOR[baseType] ?? 10;

    // Determine monthly installment for this specific loan
    // Priority:
    // 1. Per-loan monthlyInstallment from kertas kerja Excel (Angsuran/bulan column)
    //    This is per-loan and includes angsuran pokok + bunga
    // 2. Proportion from total potongan gaji (if multiple loans, divide proportionally)
    // 3. Estimated from saldo / tenor (fallback)
    let monthlyInstallment = 0;
    let installmentSource = "estimated";

    // Priority 1: Use per-loan installment from kertas kerja Excel
    if (loanBalance.monthlyInstallment) {
      monthlyInstallment = parseFloat(loanBalance.monthlyInstallment);
      if (monthlyInstallment > 0) {
        installmentSource = "excel_angsuran";
      }
    }

    // Priority 2: If no per-loan data, try to proportion from total potongan
    if (monthlyInstallment === 0) {
      // Get all loan balances for this user to calculate proportion
      const allUserBalances = await db
        .select({
          id: loanBalances.id,
          saldo: loanBalances.saldo,
          monthlyInstallment: loanBalances.monthlyInstallment,
        })
        .from(loanBalances)
        .where(eq(loanBalances.userId, loanBalance.userId));

      const totalSaldo = allUserBalances.reduce((s, lb) => s + parseFloat(lb.saldo || "0"), 0);
      const thisLoanProportion = totalSaldo > 0 ? saldo / totalSaldo : 0;

      const deductionRows = await db
        .select({
          period: monthlyDeductions.period,
          totalPinjaman: sql<string>`sum(${monthlyDeductions.pinjamanAmount})`,
        })
        .from(monthlyDeductions)
        .where(eq(monthlyDeductions.userId, loanBalance.userId))
        .groupBy(monthlyDeductions.period)
        .orderBy(sql`${monthlyDeductions.period} DESC`)
        .limit(1);

      if (deductionRows.length > 0) {
        const totalPotongan = parseFloat(deductionRows[0].totalPinjaman || "0");
        if (totalPotongan > 0 && thisLoanProportion > 0) {
          monthlyInstallment = Math.round(totalPotongan * thisLoanProportion);
          installmentSource = "potongan";
        }
      }
    }

    // Priority 3: Estimate from saldo / tenor
    if (monthlyInstallment === 0 && saldo > 0) {
      monthlyInstallment = Math.ceil(saldo / estimatedTenor);
      installmentSource = "estimated";
    }

    // Calculate remaining tenor by simulating amortization
    // monthlyInstallment = angsuran pokok + bunga
    // Each month: interest = remaining * rate/12, principal = installment - interest
    const monthlyInterestRate = interestRate / 100 / 12;
    let simRemaining = saldo;
    let remainingMonths = 0;
    const maxMonths = 120; // safety cap

    if (monthlyInstallment > 0) {
      for (let i = 0; i < maxMonths && simRemaining > 0.5; i++) {
        const interest = simRemaining * monthlyInterestRate;
        const principal = monthlyInstallment - interest;
        if (principal <= 0) {
          // Installment doesn't cover interest - use tenor estimate
          remainingMonths = estimatedTenor;
          break;
        }
        simRemaining -= principal;
        remainingMonths++;
      }
    } else {
      remainingMonths = estimatedTenor;
    }

    // Generate installment schedule
    const installments = [];
    let remaining = saldo;

    for (let i = 1; i <= remainingMonths && remaining > 0.5; i++) {
      const interestAmount = Math.round(remaining * monthlyInterestRate);
      const principalAmount = Math.min(
        Math.round(monthlyInstallment > interestAmount ? monthlyInstallment - interestAmount : monthlyInstallment),
        Math.round(remaining)
      );
      remaining = Math.max(0, remaining - principalAmount);
      const totalAmount = principalAmount + interestAmount;

      // Calculate due date from period
      const [year, month] = loanBalance.period.split("-").map(Number);
      const dueDate = new Date(year, month - 1 + i, 1);

      installments.push({
        id: `existing-${i}`,
        installmentNumber: i,
        dueDate: dueDate.toISOString(),
        principalAmount: principalAmount.toString(),
        interestAmount: interestAmount.toString(),
        totalAmount: totalAmount.toString(),
        remainingBalance: remaining.toString(),
        description: null,
        paidAt: null,
      });
    }

    return NextResponse.json({
      loanBalance: {
        id: loanBalance.id,
        loanType: loanBalance.loanType,
        period: loanBalance.period,
        saldo: loanBalance.saldo,
        monthlyInstallment: monthlyInstallment.toString(),
        interestRate: interestRate.toString(),
        estimatedTenor: remainingMonths,
      },
      owner,
      installments,
      installmentSource,
    });
  } catch (error) {
    console.error("Failed to fetch loan balance detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
