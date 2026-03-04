import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, loanInstallments, loanBalances, savings } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateInstallmentSchedule } from "@/lib/utils";

/**
 * PATCH: Update loan status for post-SPP workflow steps.
 * Role-restricted transitions:
 *   bank_process → disbursed (staf_treasury only)
 *
 * On disbursement:
 *   - Auto-generate installment schedule (kartu pinjaman)
 *   - Auto-update loan balance (saldo pinjaman)
 *   - Deduct 1% admin fee, add 1% to simpanan khusus
 */
const statusUpdateSchema = z.object({
  status: z.enum(["bank_process", "disbursed", "pending_sekper", "pending_treasury"]),
  bankPortalRef: z.string().optional(),
  notes: z.string().optional(),
});

const ALLOWED_TRANSITIONS: Record<string, { nextStatuses: string[]; allowedRoles: string[] }> = {
  spp_process: { nextStatuses: ["bank_process"], allowedRoles: ["staf_treasury"] },
  bank_process: { nextStatuses: ["disbursed"], allowedRoles: ["staf_treasury"] },
  held: { nextStatuses: ["pending_sekper"], allowedRoles: ["staf_treasury", "staf_sekper"] },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);

    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.issues }, { status: 400 });
    }

    // Get current loan
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    if (!loan) {
      return NextResponse.json({ error: "Pinjaman tidak ditemukan" }, { status: 404 });
    }

    // Check allowed transition and role
    const transition = ALLOWED_TRANSITIONS[loan.status];
    if (!transition || !transition.nextStatuses.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Tidak dapat mengubah status dari "${loan.status}" ke "${parsed.data.status}"` },
        { status: 400 }
      );
    }

    if (!transition.allowedRoles.includes(dbUser.role)) {
      return NextResponse.json(
        { error: `Role "${dbUser.role}" tidak berwenang untuk mengubah status ini. Diperlukan: ${transition.allowedRoles.join(", ")}` },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      updatedAt: new Date(),
    };

    if (parsed.data.bankPortalRef) {
      updateData.bankPortalRef = parsed.data.bankPortalRef;
    }

    const now = new Date();

    if (parsed.data.status === "disbursed") {
      updateData.disbursedAt = now;
    }

    const [updated] = await db
      .update(loans)
      .set(updateData)
      .where(eq(loans.id, id))
      .returning();

    // ── On disbursement: auto-generate installments + update saldo ──
    if (parsed.data.status === "disbursed") {
      const loanAmount = parseFloat(loan.amount);
      const annualRate = parseFloat(loan.interestRate);
      const tenorMonths = loan.tenorMonths;
      const loanType = loan.loanType;

      // 1. Generate installment schedule (kartu pinjaman)
      const schedule = generateInstallmentSchedule(loanAmount, annualRate, tenorMonths, now);
      if (schedule.length > 0) {
        await db.insert(loanInstallments).values(
          schedule.map((row) => ({
            loanId: id,
            installmentNumber: row.installmentNumber,
            dueDate: row.dueDate,
            principalAmount: row.principalAmount.toString(),
            interestAmount: row.interestAmount.toString(),
            totalAmount: row.totalAmount.toString(),
            remainingBalance: row.remainingBalance.toString(),
            description: row.description,
          }))
        );
      }

      // 2. Auto-update loan balance (saldo pinjaman) for the member
      const period = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      const existingBalance = await db
        .select()
        .from(loanBalances)
        .where(
          and(
            eq(loanBalances.userId, loan.userId),
            eq(loanBalances.loanType, loanType),
            eq(loanBalances.period, period)
          )
        );

      const currentSaldo = existingBalance.length > 0
        ? parseFloat(existingBalance[0].saldo || "0")
        : 0;
      const newSaldo = currentSaldo + loanAmount;

      if (existingBalance.length > 0) {
        await db
          .update(loanBalances)
          .set({ saldo: newSaldo.toString(), updatedAt: now })
          .where(eq(loanBalances.id, existingBalance[0].id));
      } else {
        await db.insert(loanBalances).values({
          userId: loan.userId,
          loanType,
          period,
          saldo: newSaldo.toString(),
          uploadBatchId: `auto-disbursement-${id}`,
        });
      }

      // 3. Add 1% simpanan khusus to member's savings
      const simpananKhususAmount = Math.round(loanAmount * 0.01);
      const existingSavings = await db
        .select()
        .from(savings)
        .where(eq(savings.userId, loan.userId))
        .limit(1);

      if (existingSavings.length > 0) {
        const currentSK = parseFloat(existingSavings[0].simpananKhusus || "0");
        const currentTotal = parseFloat(existingSavings[0].totalBalance || "0");
        await db
          .update(savings)
          .set({
            simpananKhusus: (currentSK + simpananKhususAmount).toString(),
            totalBalance: (currentTotal + simpananKhususAmount).toString(),
            updatedAt: now,
          })
          .where(eq(savings.id, existingSavings[0].id));
      }
    }

    return NextResponse.json({ loan: updated });
  } catch (error) {
    console.error("Failed to update loan status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
