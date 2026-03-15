import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, approvals, users, loanBalances, loanInstallments, monthlyDeductions } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, ne, notInArray, sql } from "drizzle-orm";

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

    // Ensure the caller has a DB user record
    await getOrCreateUser(authUser);

    const { id } = await params;

    // 1. Fetch the loan by ID
    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, id));

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // 2. Fetch the requester (loan owner) info
    const [requester] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
        department: users.department,
        employeeId: users.employeeId,
      })
      .from(users)
      .where(eq(users.id, loan.userId));

    // 3. Fetch the requester's OTHER active loans (only disbursed/selesai = truly active)
    const activeLoans = await db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.userId, loan.userId),
          ne(loans.id, id),
          sql`${loans.status} IN ('disbursed', 'selesai')`
        )
      );

    // 4. Fetch the requester's OTHER pending loan requests
    //    (pending_* statuses, excluding current loan)
    const pendingRequests = await db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.userId, loan.userId),
          ne(loans.id, id),
          notInArray(loans.status, [
            "draft",
            "approved",
            "spp_process",
            "bank_process",
            "disbursed",
            "rejected",
            "analysis",
          ])
        )
      );

    // 5. Fetch all approval steps for this loan, with approver info
    const approvalRows = await db
      .select({
        id: approvals.id,
        stepOrder: approvals.stepOrder,
        stepLabel: approvals.stepLabel,
        approverRole: approvals.approverRole,
        approverId: approvals.approverId,
        action: approvals.action,
        comments: approvals.comments,
        decidedAt: approvals.decidedAt,
        createdAt: approvals.createdAt,
        // Approver info (nullable — step may not yet have an assigned approver)
        approverName: users.fullName,
        approverEmail: users.email,
      })
      .from(approvals)
      .leftJoin(users, eq(approvals.approverId, users.id))
      .where(
        and(
          eq(approvals.referenceType, "loan"),
          eq(approvals.referenceId, id)
        )
      )
      .orderBy(approvals.stepOrder);

    const approvalSteps = approvalRows.map((row) => ({
      id: row.id,
      stepOrder: row.stepOrder,
      stepLabel: row.stepLabel,
      approverRole: row.approverRole,
      action: row.action,
      comments: row.comments,
      decidedAt: row.decidedAt,
      createdAt: row.createdAt,
      approver: row.approverId
        ? {
            id: row.approverId,
            fullName: row.approverName,
            email: row.approverEmail,
          }
        : null,
    }));

    // 6. Fetch the requester's imported loan balances
    const importedBalances = await db
      .select({
        loanType: loanBalances.loanType,
        saldo: loanBalances.saldo,
        monthlyInstallment: loanBalances.monthlyInstallment,
      })
      .from(loanBalances)
      .where(eq(loanBalances.userId, loan.userId));

    // 6b. Get actual monthly deduction from potongan data (most accurate)
    const deductionRows = await db
      .select({
        period: monthlyDeductions.period,
        totalPinjaman: sql<string>`sum(${monthlyDeductions.pinjamanAmount})`,
      })
      .from(monthlyDeductions)
      .where(eq(monthlyDeductions.userId, loan.userId))
      .groupBy(monthlyDeductions.period)
      .orderBy(sql`${monthlyDeductions.period} DESC`)
      .limit(1);

    const actualMonthlyDeduction = deductionRows.length > 0
      ? parseFloat(deductionRows[0].totalPinjaman || "0")
      : 0;

    // 6c. Calculate installment from loanBalances (monthlyInstallment or saldo/tenor fallback)
    const ESTIMATED_TENOR: Record<string, number> = {
      reguler: 10,
      khusus: 24,
      barang: 10,
    };
    let loanBalanceInstallment = 0;
    let estimatedInstallment = 0;
    for (const lb of importedBalances) {
      const saldo = parseFloat(lb.saldo || "0");
      if (saldo > 0) {
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

    // Priority: potongan > Excel angsuran > saldo/tenor estimate
    const estimatedSaldoInstallment = actualMonthlyDeduction > 0
      ? actualMonthlyDeduction
      : (loanBalanceInstallment > 0 ? loanBalanceInstallment : estimatedInstallment);

    const installmentSource = actualMonthlyDeduction > 0
      ? "potongan"
      : (loanBalanceInstallment > 0 ? "excel_angsuran" : "estimated");

    // 7. Fetch installment schedule (kartu pinjaman)
    const installments = await db
      .select()
      .from(loanInstallments)
      .where(eq(loanInstallments.loanId, id))
      .orderBy(loanInstallments.installmentNumber);

    return NextResponse.json({
      loan,
      requester,
      activeLoans,
      pendingRequests,
      approvalSteps,
      loanBalances: importedBalances,
      estimatedSaldoInstallment,
      installmentSource,
      installments,
    });
  } catch (error) {
    console.error("Failed to fetch loan detail:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
