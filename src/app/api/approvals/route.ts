import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, loans, paymentRequests, users, employeeData } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eq, and, isNull } from "drizzle-orm";
import {
  insertJournal,
  LOAN_COA_MAP,
  BANK_MANDIRI_COA,
  BANK_MANDIRI_KOPERASI_ACCOUNT,
} from "@/lib/accurate";
import { z } from "zod";

const approvalSchema = z.object({
  approvalId: z.string().uuid(),
  action: z.enum(["approve", "reject", "adjust"]),
  comments: z.string().optional(),
});

const LOAN_STATUS_FLOW: Record<string, string> = {
  pending_staff: "pending_manager",
  pending_manager: "pending_bendahara",
  pending_bendahara: "pending_ketua",
  pending_ketua: "approved",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    // Get approval record
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, parsed.data.approvalId));

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Verify the user has the correct role
    if (approval.approverRole !== dbUser.role) {
      return NextResponse.json({ error: "Not authorized for this approval step" }, { status: 403 });
    }

    // Update approval record
    await db
      .update(approvals)
      .set({
        approverId: dbUser.id,
        action: parsed.data.action,
        comments: parsed.data.comments,
        decidedAt: new Date(),
      })
      .where(eq(approvals.id, parsed.data.approvalId));

    // Handle loan approvals
    if (approval.referenceType === "loan") {
      if (parsed.data.action === "reject") {
        await db
          .update(loans)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(loans.id, approval.referenceId));
      } else if (parsed.data.action === "approve") {
        const [loan] = await db
          .select()
          .from(loans)
          .where(eq(loans.id, approval.referenceId));

        if (loan) {
          const nextStatus = LOAN_STATUS_FLOW[loan.status] || loan.status;
          await db
            .update(loans)
            .set({
              status: nextStatus as typeof loan.status,
              updatedAt: new Date(),
            })
            .where(eq(loans.id, loan.id));

          // Final approval by ketua - post journal to Accurate
          if (nextStatus === "approved") {
            const [borrower] = await db
              .select()
              .from(users)
              .where(eq(users.id, loan.userId));

            const [empData] = await db
              .select()
              .from(employeeData)
              .where(eq(employeeData.userId, loan.userId));

            const coaCode = LOAN_COA_MAP[loan.loanType] || "110304";
            const employeeName = empData?.fullName || borrower?.fullName || "Unknown";

            const journalResult = await insertJournal({
              transDate: new Date().toISOString().split("T")[0],
              description: `Pencairan Pinjaman ${loan.loanType} - ${employeeName}`,
              detailList: [
                {
                  accountNo: coaCode,
                  debit: parseFloat(loan.amount),
                  credit: 0,
                  description: `Piutang Pinjaman ${loan.loanType} - ${employeeName}`,
                },
                {
                  accountNo: BANK_MANDIRI_COA,
                  debit: 0,
                  credit: parseFloat(loan.amount),
                  description: `Bank Mandiri Koperasi (${BANK_MANDIRI_KOPERASI_ACCOUNT}) - Pencairan ${employeeName}`,
                },
              ],
            });

            if (journalResult) {
              await db
                .update(loans)
                .set({
                  accurateJournalId: journalResult.id.toString(),
                  coaCode,
                  status: "disbursed",
                  disbursedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(loans.id, loan.id));
            }
          }
        }
      }
    }

    // Handle payment request approvals
    if (approval.referenceType === "payment_request") {
      if (parsed.data.action === "reject") {
        await db
          .update(paymentRequests)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(paymentRequests.id, approval.referenceId));
      } else if (parsed.data.action === "approve") {
        // Check if this is the final approval step
        const allApprovals = await db
          .select()
          .from(approvals)
          .where(
            and(
              eq(approvals.referenceId, approval.referenceId),
              eq(approvals.referenceType, "payment_request")
            )
          );

        const allApproved = allApprovals.every(
          (a) => a.id === approval.id || a.action === "approve"
        );

        await db
          .update(paymentRequests)
          .set({
            status: allApproved ? "approved" : "in_review",
            updatedAt: new Date(),
          })
          .where(eq(paymentRequests.id, approval.referenceId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pendingApprovals = await db
      .select()
      .from(approvals)
      .where(
        and(
          eq(approvals.approverRole, dbUser.role),
          isNull(approvals.action)
        )
      );

    return NextResponse.json({ approvals: pendingApprovals });
  } catch (error) {
    console.error("Failed to fetch approvals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
