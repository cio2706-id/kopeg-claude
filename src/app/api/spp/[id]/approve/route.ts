import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { spp, loans, purchaseOrders } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq } from "drizzle-orm";
import { z } from "zod";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
});

/**
 * SPP Approval flow:
 * draft → staf_treasury submits → pending_manager
 * pending_manager → manager approves → pending_bendahara
 * pending_bendahara → bendahara approves → approved
 *
 * On final approval:
 * - If linked to loan: update loan status to bank_process
 * - If linked to PO: update PO status to spp_process
 */
export async function POST(
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
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { action, comments } = parsed.data;

    // Get current SPP
    const [currentSpp] = await db.select().from(spp).where(eq(spp.id, id));
    if (!currentSpp) {
      return NextResponse.json({ error: "SPP not found" }, { status: 404 });
    }

    const now = new Date();

    // Handle rejection at any stage
    if (action === "reject") {
      await db
        .update(spp)
        .set({
          status: "rejected",
          notes: comments || currentSpp.notes,
          updatedAt: now,
        })
        .where(eq(spp.id, id));

      return NextResponse.json({ success: true, newStatus: "rejected" });
    }

    // Handle approval based on current status and user role
    let newStatus: string;
    const updateData: Record<string, unknown> = { updatedAt: now };

    if (currentSpp.status === "draft" && dbUser.role === "staf_treasury") {
      // Treasury submits → pending_manager
      newStatus = "pending_manager";
      updateData.approvedByTreasury = dbUser.id;
      updateData.approvedByTreasuryAt = now;
    } else if (currentSpp.status === "pending_manager" && dbUser.role === "manager") {
      // Manager approves → pending_bendahara
      newStatus = "pending_bendahara";
      updateData.approvedByManager = dbUser.id;
      updateData.approvedByManagerAt = now;
    } else if (currentSpp.status === "pending_bendahara" && dbUser.role === "bendahara") {
      // Bendahara approves → approved (final)
      newStatus = "approved";
      updateData.approvedByBendahara = dbUser.id;
      updateData.approvedByBendaharaAt = now;
    } else {
      return NextResponse.json(
        { error: `Anda tidak berwenang untuk menyetujui SPP dengan status "${currentSpp.status}"` },
        { status: 403 }
      );
    }

    updateData.status = newStatus;
    if (comments) updateData.notes = comments;

    await db.update(spp).set(updateData).where(eq(spp.id, id));

    // On final approval, update linked loan/PO status
    if (newStatus === "approved") {
      if (currentSpp.referenceType === "loan" && currentSpp.referenceId) {
        await db
          .update(loans)
          .set({ status: "bank_process", updatedAt: now })
          .where(eq(loans.id, currentSpp.referenceId));
      } else if (currentSpp.referenceType === "purchase_order" && currentSpp.referenceId) {
        await db
          .update(purchaseOrders)
          .set({ status: "spp_process", updatedAt: now })
          .where(eq(purchaseOrders.id, currentSpp.referenceId));
      }
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    console.error("Failed to approve SPP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
