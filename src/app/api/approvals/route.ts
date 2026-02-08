import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  approvals,
  loans,
  purchaseOrders,
  paymentRequests,
  users,
  employeeData,
} from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, isNull } from "drizzle-orm";
import {
  insertJournal,
  LOAN_COA_MAP,
  BANK_MANDIRI_COA,
  BANK_MANDIRI_KOPERASI_ACCOUNT,
} from "@/lib/accurate";
import { LOAN_STATUS_FLOW } from "@/lib/utils";
import { z } from "zod";

const approvalSchema = z.object({
  approvalId: z.string().uuid(),
  action: z.enum(["approve", "reject", "adjust"]),
  comments: z.string().optional(),
  creditAnalysis: z.string().optional(),
  creditScore: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, parsed.data.approvalId));

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    if (approval.approverRole !== dbUser.role) {
      return NextResponse.json(
        { error: "Not authorized for this approval step" },
        { status: 403 }
      );
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

    // ─── Handle Loan Approvals ───────────────────────────────────────
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
          // Staf Treasury step: save credit analysis data
          if (
            dbUser.role === "staf_treasury" &&
            (parsed.data.creditAnalysis || parsed.data.creditScore)
          ) {
            await db
              .update(loans)
              .set({
                creditAnalysis: parsed.data.creditAnalysis,
                creditScore: parsed.data.creditScore,
                analysisNotes: parsed.data.comments,
                analyzedBy: dbUser.id,
                analyzedAt: new Date(),
              })
              .where(eq(loans.id, loan.id));
          }

          const nextStatus = LOAN_STATUS_FLOW[loan.status] || loan.status;
          await db
            .update(loans)
            .set({
              status: nextStatus as typeof loan.status,
              updatedAt: new Date(),
            })
            .where(eq(loans.id, loan.id));

          // Ketua final approval → move to SPP process, then Staf Treasury
          // handles SPP via Accurate + bank portal
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
            const employeeName =
              empData?.fullName || borrower?.fullName || "Unknown";

            // Post SPP journal to Accurate
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
                  status: "spp_process",
                  updatedAt: new Date(),
                })
                .where(eq(loans.id, loan.id));
            }
          }
        }
      }
    }

    // ─── Handle PO Approvals ─────────────────────────────────────────
    if (approval.referenceType === "purchase_order") {
      if (parsed.data.action === "reject") {
        await db
          .update(purchaseOrders)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(purchaseOrders.id, approval.referenceId));
      } else if (parsed.data.action === "approve") {
        const [po] = await db
          .select()
          .from(purchaseOrders)
          .where(eq(purchaseOrders.id, approval.referenceId));

        if (po) {
          if (dbUser.role === "staf_pengadaan") {
            // Staf Pengadaan approved → move to pending_manager
            await db
              .update(purchaseOrders)
              .set({ status: "pending_manager", updatedAt: new Date() })
              .where(eq(purchaseOrders.id, po.id));
          } else if (dbUser.role === "manager") {
            // Manager approved RAB → move to approved_rab (Staf Treasury takes over)
            await db
              .update(purchaseOrders)
              .set({ status: "approved_rab", updatedAt: new Date() })
              .where(eq(purchaseOrders.id, po.id));
          }
        }
      }
    }

    // ─── Handle Payment Request Approvals ────────────────────────────
    if (approval.referenceType === "payment_request") {
      if (parsed.data.action === "reject") {
        await db
          .update(paymentRequests)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(paymentRequests.id, approval.referenceId));
      } else if (parsed.data.action === "approve") {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    // Pengurus pages pass ?view=all to see ALL pending approvals
    // Otherwise, non-member roles see all, members see only their role's approvals
    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get("view") === "all";

    const pendingApprovals =
      viewAll || dbUser.role !== "member"
        ? await db
            .select()
            .from(approvals)
            .where(isNull(approvals.action))
        : await db
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
