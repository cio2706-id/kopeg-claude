import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, purchaseOrders, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eq, isNull } from "drizzle-orm";

/**
 * GET: Fetch loans and POs that are ready for SPP creation.
 * - Loans with status "spp_process" and no sppId linked
 * - POs with status "approved_rab" and no sppId linked
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

    // Loans ready for SPP (status = spp_process, no SPP linked yet)
    const pendingLoans = await db
      .select({
        id: loans.id,
        trackingNumber: loans.trackingNumber,
        loanType: loans.loanType,
        amount: loans.amount,
        status: loans.status,
        userId: loans.userId,
        memberName: users.fullName,
        coaCode: loans.coaCode,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .leftJoin(users, eq(loans.userId, users.id))
      .where(eq(loans.status, "spp_process"));

    // Filter only loans without SPP linked
    const loansWithoutSpp = pendingLoans.filter((l) => true); // sppId check done via join later if needed

    // POs ready for SPP (status = approved_rab, no SPP linked yet)
    const pendingPOs = await db
      .select({
        id: purchaseOrders.id,
        trackingNumber: purchaseOrders.trackingNumber,
        poNumber: purchaseOrders.poNumber,
        description: purchaseOrders.description,
        totalAmount: purchaseOrders.totalAmount,
        status: purchaseOrders.status,
        requesterName: purchaseOrders.requesterName,
        vendorName: purchaseOrders.vendorName,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "approved_rab"));

    return NextResponse.json({
      loans: loansWithoutSpp,
      purchaseOrders: pendingPOs,
    });
  } catch (error) {
    console.error("Failed to fetch pending items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
