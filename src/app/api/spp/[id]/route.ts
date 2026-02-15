import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { spp, sppItems, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";

// ─── GET: SPP Detail ─────────────────────────────────────────────────────────

export async function GET(
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

    // Get SPP with creator info
    const [sppRecord] = await db
      .select({
        id: spp.id,
        sppNumber: spp.sppNumber,
        referenceType: spp.referenceType,
        referenceId: spp.referenceId,
        unitKerja: spp.unitKerja,
        requestDate: spp.requestDate,
        payableTo: spp.payableTo,
        totalAmount: spp.totalAmount,
        amountInWords: spp.amountInWords,
        supportingDocs: spp.supportingDocs,
        hasPph23: spp.hasPph23,
        pphDetails: spp.pphDetails,
        totalInvoice: spp.totalInvoice,
        pphDue: spp.pphDue,
        status: spp.status,
        createdBy: spp.createdBy,
        approvedByTreasury: spp.approvedByTreasury,
        approvedByTreasuryAt: spp.approvedByTreasuryAt,
        approvedByManager: spp.approvedByManager,
        approvedByManagerAt: spp.approvedByManagerAt,
        approvedByBendahara: spp.approvedByBendahara,
        approvedByBendaharaAt: spp.approvedByBendaharaAt,
        notes: spp.notes,
        createdAt: spp.createdAt,
        updatedAt: spp.updatedAt,
        creatorName: users.fullName,
      })
      .from(spp)
      .leftJoin(users, eq(spp.createdBy, users.id))
      .where(eq(spp.id, id));

    if (!sppRecord) {
      return NextResponse.json({ error: "SPP not found" }, { status: 404 });
    }

    // Get line items
    const items = await db
      .select()
      .from(sppItems)
      .where(eq(sppItems.sppId, id))
      .orderBy(sppItems.sortOrder);

    // Get approver names
    const approverNames: Record<string, string> = {};
    const approverIds = [
      sppRecord.approvedByTreasury,
      sppRecord.approvedByManager,
      sppRecord.approvedByBendahara,
    ].filter(Boolean) as string[];

    if (approverIds.length > 0) {
      const approvers = await db
        .select({ id: users.id, fullName: users.fullName })
        .from(users);
      for (const a of approvers) {
        if (approverIds.includes(a.id)) {
          approverNames[a.id] = a.fullName;
        }
      }
    }

    return NextResponse.json({
      spp: sppRecord,
      items,
      approverNames,
    });
  } catch (error) {
    console.error("Failed to fetch SPP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
