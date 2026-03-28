import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  approvals,
  loans,
  purchaseOrders,
  paymentRequests,
  users,
  employeeData,
  loanQuotas,
} from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import {
  insertJournal,
  LOAN_COA_MAP,
  BANK_MANDIRI_COA,
  BANK_MANDIRI_KOPERASI_ACCOUNT,
} from "@/lib/accurate";
import { LOAN_STATUS_FLOW, calculateMonthlyInstallment, InterestMethod } from "@/lib/utils";
import { z } from "zod";

const approvalSchema = z.object({
  approvalId: z.string().uuid(),
  action: z.enum(["approve", "reject", "adjust", "hold"]),
  comments: z.string().optional(),
  creditAnalysis: z.string().optional(),
  creditScore: z.string().optional(),
  // PO manager price adjustment
  totalAmount: z.number().positive().optional(),
  adjustmentNotes: z.string().optional(),
  // Loan manager price (for barang/travel/kendaraan)
  loanAmount: z.number().positive().optional(),
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
      if (parsed.data.action === "hold") {
        // Only Bendahara can hold loans
        if (dbUser.role !== "bendahara") {
          return NextResponse.json(
            { error: "Hanya Bendahara yang dapat menunda pinjaman" },
            { status: 403 }
          );
        }
        // Hold: move loan to next month's queue
        const [loan] = await db
          .select()
          .from(loans)
          .where(eq(loans.id, approval.referenceId));

        if (loan) {
          const now = new Date();
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextPeriod = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, "0")}`;

          // Get next queue number for next month
          const [maxQueue] = await db
            .select({ maxNum: sql<number>`COALESCE(MAX(${loans.queueNumber}), 0)` })
            .from(loans)
            .where(eq(loans.queuePeriod, nextPeriod));

          const newQueueNumber = (maxQueue?.maxNum || 0) + 1;

          // Reset approval record so it stays pending (undo the action we just set)
          await db
            .update(approvals)
            .set({
              approverId: null,
              action: null,
              comments: null,
              decidedAt: null,
            })
            .where(eq(approvals.id, parsed.data.approvalId));

          // Update loan: set held status, new queue period/number, hold reason
          await db
            .update(loans)
            .set({
              status: "held",
              queueNumber: newQueueNumber,
              queuePeriod: nextPeriod,
              holdReason: parsed.data.comments || "Ditunda ke bulan berikutnya",
              updatedAt: new Date(),
            })
            .where(eq(loans.id, loan.id));

        }
      } else if (parsed.data.action === "reject") {
        await db
          .update(loans)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(loans.id, approval.referenceId));

        // Mark all remaining pending approval steps as skipped (so they don't appear as pending)
        await db
          .update(approvals)
          .set({
            action: "reject",
            comments: `Ditolak oleh ${dbUser.fullName || dbUser.email} pada step sebelumnya. Alasan: ${parsed.data.comments || "-"}`,
            decidedAt: new Date(),
          })
          .where(
            and(
              eq(approvals.referenceId, approval.referenceId),
              eq(approvals.referenceType, "loan"),
              isNull(approvals.action)
            )
          );
      } else if (parsed.data.action === "approve") {
        const [loan] = await db
          .select()
          .from(loans)
          .where(eq(loans.id, approval.referenceId));

        if (loan) {
          // Staf Sekper step: save credit analysis data
          if (
            (dbUser.role === "staf_sekper" || dbUser.role === "staf_treasury") &&
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

          // Manager step: update loan amount for item loans (barang/travel/kendaraan)
          if (
            dbUser.role === "manager" &&
            parsed.data.loanAmount &&
            ["barang", "travel", "kepemilikan_kendaraan"].includes(loan.loanType)
          ) {
            const newAmount = parsed.data.loanAmount;
            const interestRate = parseFloat(loan.interestRate);
            const interestMethod = (loan.interestMethod as InterestMethod) || "flat";
            const newInstallment = calculateMonthlyInstallment(
              newAmount,
              interestRate,
              loan.tenorMonths,
              interestMethod
            );

            await db
              .update(loans)
              .set({
                amount: newAmount.toString(),
                monthlyInstallment: Math.round(newInstallment).toString(),
                updatedAt: new Date(),
              })
              .where(eq(loans.id, loan.id));
          }

          // Use the updated amount (if manager changed it) for quota check
          const effectiveAmount = parsed.data.loanAmount
            ? parsed.data.loanAmount.toString()
            : loan.amount;

          const nextStatus = LOAN_STATUS_FLOW[loan.status] || loan.status;

          // ── Quota check before final approval (auto-hold if exceeded) ──
          if (nextStatus === "approved" && loan.queuePeriod) {
            const DEFAULT_QUOTAS: Record<string, number> = {
              reguler: 50_000_000,
              khusus: 70_000_000,
            };

            const loanAmount = parseFloat(effectiveAmount);
            const loanType = loan.loanType;

            // Get current used amounts for this period
            const approvedStatuses = ["approved", "spp_process", "bank_process", "disbursed", "selesai"] as const;
            const usedAmounts = await db
              .select({
                loanType: loans.loanType,
                totalAmount: sql<string>`COALESCE(SUM(${loans.amount}::NUMERIC), 0)`,
              })
              .from(loans)
              .where(
                and(
                  eq(loans.queuePeriod, loan.queuePeriod),
                  inArray(loans.status, [...approvedStatuses])
                )
              )
              .groupBy(loans.loanType);

            const usedByType: Record<string, number> = {};
            for (const row of usedAmounts) {
              usedByType[row.loanType] = parseFloat(row.totalAmount || "0");
            }

            // Get quota settings for this period
            const periodQuotas = await db
              .select()
              .from(loanQuotas)
              .where(eq(loanQuotas.period, loan.queuePeriod));

            const getQuotaForType = (type: string) => {
              const q = periodQuotas.find((pq) => pq.loanType === type);
              return q ? parseFloat(q.quotaAmount) : (DEFAULT_QUOTAS[type] || 0);
            };

            const regulerQuota = getQuotaForType("reguler");
            const khususQuota = getQuotaForType("khusus");
            const regulerUsed = usedByType["reguler"] || 0;
            const khususUsed = usedByType["khusus"] || 0;

            let quotaExceeded = false;

            if (loanType === "reguler" || loanType === "khusus") {
              // Cross-usage: reguler and khusus share a combined pool
              const combinedQuota = regulerQuota + khususQuota;
              const combinedUsed = regulerUsed + khususUsed;

              if (combinedUsed + loanAmount > combinedQuota) {
                quotaExceeded = true;
              }
            } else {
              // Other types: check own quota only
              const ownQuota = getQuotaForType(loanType);
              const ownUsed = usedByType[loanType] || 0;
              if (ownQuota > 0 && ownUsed + loanAmount > ownQuota) {
                quotaExceeded = true;
              }
            }

            if (quotaExceeded) {
              // Auto-hold: move loan to held status with next month queue
              const now = new Date();
              const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
              const nextPeriod = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, "0")}`;

              const [maxQueue] = await db
                .select({ maxNum: sql<number>`COALESCE(MAX(${loans.queueNumber}), 0)` })
                .from(loans)
                .where(eq(loans.queuePeriod, nextPeriod));

              const newQueueNumber = (maxQueue?.maxNum || 0) + 1;

              // Reset approval record
              await db
                .update(approvals)
                .set({
                  approverId: null,
                  action: null,
                  comments: null,
                  decidedAt: null,
                })
                .where(eq(approvals.id, parsed.data.approvalId));

              await db
                .update(loans)
                .set({
                  status: "held",
                  queueNumber: newQueueNumber,
                  queuePeriod: nextPeriod,
                  holdReason: `Kuota pinjaman bulan ini telah terlampaui. Dipindahkan ke bulan ${nextPeriod}.`,
                  updatedAt: new Date(),
                })
                .where(eq(loans.id, loan.id));

              return NextResponse.json({
                success: true,
                held: true,
                message: `Pinjaman otomatis ditunda karena kuota bulan ${loan.queuePeriod} telah terlampaui.`,
              });
            }
          }

          await db
            .update(loans)
            .set({
              status: nextStatus as typeof loan.status,
              updatedAt: new Date(),
            })
            .where(eq(loans.id, loan.id));

          // Update used_amount in quota when loan gets final approval
          if (nextStatus === "approved" && loan.queuePeriod) {
            const loanAmount = parseFloat(effectiveAmount);
            const existingQuota = await db
              .select()
              .from(loanQuotas)
              .where(
                and(
                  eq(loanQuotas.period, loan.queuePeriod),
                  eq(loanQuotas.loanType, loan.loanType)
                )
              );
            if (existingQuota.length > 0) {
              const currentUsed = parseFloat(existingQuota[0].usedAmount || "0");
              await db
                .update(loanQuotas)
                .set({
                  usedAmount: (currentUsed + loanAmount).toString(),
                  updatedAt: new Date(),
                })
                .where(eq(loanQuotas.id, existingQuota[0].id));
            }
          }

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
                  debit: parseFloat(effectiveAmount),
                  credit: 0,
                  description: `Piutang Pinjaman ${loan.loanType} - ${employeeName}`,
                },
                {
                  accountNo: BANK_MANDIRI_COA,
                  debit: 0,
                  credit: parseFloat(effectiveAmount),
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

        // Mark all remaining pending approval steps as rejected
        await db
          .update(approvals)
          .set({
            action: "reject",
            comments: `Ditolak oleh ${dbUser.fullName || dbUser.email} pada step sebelumnya. Alasan: ${parsed.data.comments || "-"}`,
            decidedAt: new Date(),
          })
          .where(
            and(
              eq(approvals.referenceId, approval.referenceId),
              eq(approvals.referenceType, "purchase_order"),
              isNull(approvals.action)
            )
          );
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
            const updateData: Record<string, unknown> = {
              status: "approved_rab",
              updatedAt: new Date(),
            };

            // Manager can adjust the price before approving
            if (parsed.data.totalAmount) {
              updateData.totalAmount = parsed.data.totalAmount.toString();
              updateData.adjustedBy = dbUser.id;
              if (parsed.data.adjustmentNotes) {
                updateData.adjustmentNotes = parsed.data.adjustmentNotes;
              }
            }

            await db
              .update(purchaseOrders)
              .set(updateData)
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

        // Mark all remaining pending approval steps as rejected
        await db
          .update(approvals)
          .set({
            action: "reject",
            comments: `Ditolak oleh ${dbUser.fullName || dbUser.email} pada step sebelumnya. Alasan: ${parsed.data.comments || "-"}`,
            decidedAt: new Date(),
          })
          .where(
            and(
              eq(approvals.referenceId, approval.referenceId),
              eq(approvals.referenceType, "payment_request"),
              isNull(approvals.action)
            )
          );
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

    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get("view") === "all";

    // Get all pending approvals (no action taken yet)
    const allPending = await db
      .select()
      .from(approvals)
      .where(isNull(approvals.action));

    // Group by referenceId, keep only the CURRENT step (lowest stepOrder)
    const currentStepByRef = new Map<string, typeof allPending[0]>();
    for (const a of allPending) {
      const existing = currentStepByRef.get(a.referenceId);
      if (!existing || a.stepOrder < existing.stepOrder) {
        currentStepByRef.set(a.referenceId, a);
      }
    }
    const currentSteps = Array.from(currentStepByRef.values());

    // For pengurus dashboard (view=all): only return items matching user's role
    // For member: return items matching their role (usually none)
    let filteredApprovals;
    if (viewAll) {
      // Pengurus dashboard: only show items where current step matches this user's role
      // staf_treasury does NOT approve loans - they handle SPP creation instead
      filteredApprovals = currentSteps.filter(
        (a) => a.approverRole === dbUser.role && !(dbUser.role === "staf_treasury" && a.referenceType === "loan")
      );
    } else if (dbUser.role !== "member") {
      // Pengurus approvals page: show all current steps
      // Exclude loan approvals for staf_treasury (they handle SPP, not loan approvals)
      filteredApprovals = dbUser.role === "staf_treasury"
        ? currentSteps.filter((a) => a.referenceType !== "loan")
        : currentSteps;
    } else {
      // Member: only their role's approvals
      filteredApprovals = currentSteps.filter(
        (a) => a.approverRole === dbUser.role
      );
    }

    return NextResponse.json({
      approvals: filteredApprovals,
      userRole: dbUser.role,
      totalPendingAll: currentSteps.length,
    });
  } catch (error) {
    console.error("Failed to fetch approvals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
