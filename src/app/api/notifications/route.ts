import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, loans, purchaseOrders, spp } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, isNull, inArray, and } from "drizzle-orm";

/**
 * GET: Return notification counts for the current user's role.
 * - pendingApprovals: approvals waiting for this user's role
 * - pendingSppLoans: loans ready for SPP creation (approved/spp_process)
 * - pendingSppPOs: POs ready for SPP creation (approved_rab)
 * - pendingSppApprovals: SPP documents waiting for approval
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    // 1. Pending approvals for this role
    const allPending = await db
      .select()
      .from(approvals)
      .where(isNull(approvals.action));

    // Group by referenceId, keep only the CURRENT step (lowest stepOrder)
    const currentStepByRef = new Map<string, (typeof allPending)[0]>();
    for (const a of allPending) {
      const existing = currentStepByRef.get(a.referenceId);
      if (!existing || a.stepOrder < existing.stepOrder) {
        currentStepByRef.set(a.referenceId, a);
      }
    }

    const myApprovals = Array.from(currentStepByRef.values()).filter(
      (a) => a.approverRole === dbUser.role
    );

    // 2. SPP pending items (for staf_treasury)
    let pendingSppLoans = 0;
    let pendingSppPOs = 0;

    if (dbUser.role === "staf_treasury") {
      const sppLoans = await db
        .select({ id: loans.id, sppId: loans.sppId })
        .from(loans)
        .where(inArray(loans.status, ["approved", "spp_process"]));
      pendingSppLoans = sppLoans.filter((l) => !l.sppId).length;

      const sppPOs = await db
        .select({ id: purchaseOrders.id })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.status, "approved_rab"));
      pendingSppPOs = sppPOs.length;
    }

    // 3. SPP pending approval for manager/bendahara
    let pendingSppApprovals = 0;
    if (dbUser.role === "manager") {
      const pending = await db
        .select({ id: spp.id })
        .from(spp)
        .where(eq(spp.status, "pending_manager"));
      pendingSppApprovals = pending.length;
    } else if (dbUser.role === "bendahara") {
      const pending = await db
        .select({ id: spp.id })
        .from(spp)
        .where(eq(spp.status, "pending_bendahara"));
      pendingSppApprovals = pending.length;
    }

    return NextResponse.json({
      pendingApprovals: myApprovals.length,
      pendingSppLoans,
      pendingSppPOs,
      pendingSppApprovals,
      totalSpp: pendingSppLoans + pendingSppPOs + pendingSppApprovals,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
