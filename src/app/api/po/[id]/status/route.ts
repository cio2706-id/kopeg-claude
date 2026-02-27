import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * PATCH: Update PO status for post-SPP workflow steps.
 * Each step is done by the appointed pengurus role.
 *
 * Flow after SPP approved:
 *   spp_process → procurement (staf_pengadaan)
 *   procurement → delivery (staf_pengadaan)
 *   delivery → goods_received (staf_piutang)
 *   goods_received → goods_delivered (staf_piutang)
 *   goods_delivered → invoicing (staf_piutang) - requires invoice upload
 *   invoicing → waiting_payment (staf_akunting)
 *   waiting_payment → payment_received (staf_treasury)
 *   payment_received → completed (staf_akunting) - requires payment verification
 */
const statusUpdateSchema = z.object({
  status: z.enum([
    "spp_process", "procurement", "delivery", "goods_received",
    "goods_delivered", "invoicing", "waiting_payment",
    "payment_received", "completed",
  ]),
  vendorName: z.string().optional(),
  deliveryDate: z.string().optional(),
  receiptDocumentUrl: z.string().url().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  invoiceDocumentUrl: z.string().url().optional(),
  taxInvoiceNumber: z.string().optional(),
  paymentRef: z.string().optional(),
  paymentVerified: z.boolean().optional(),
  notes: z.string().optional(),
});

const ALLOWED_TRANSITIONS: Record<string, { nextStatuses: string[]; allowedRoles: string[] }> = {
  approved_rab: { nextStatuses: ["spp_process"], allowedRoles: ["staf_treasury"] },
  spp_process: { nextStatuses: ["procurement"], allowedRoles: ["staf_pengadaan"] },
  procurement: { nextStatuses: ["delivery"], allowedRoles: ["staf_pengadaan"] },
  delivery: { nextStatuses: ["goods_received"], allowedRoles: ["staf_piutang"] },
  goods_received: { nextStatuses: ["goods_delivered"], allowedRoles: ["staf_piutang"] },
  goods_delivered: { nextStatuses: ["invoicing"], allowedRoles: ["staf_piutang"] },
  invoicing: { nextStatuses: ["waiting_payment"], allowedRoles: ["staf_akunting"] },
  waiting_payment: { nextStatuses: ["payment_received"], allowedRoles: ["staf_treasury"] },
  payment_received: { nextStatuses: ["completed"], allowedRoles: ["staf_akunting"] },
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

    // Get current PO
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (!po) {
      return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
    }

    // Check allowed transition and role
    const transition = ALLOWED_TRANSITIONS[po.status];
    if (!transition || !transition.nextStatuses.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Tidak dapat mengubah status dari "${po.status}" ke "${parsed.data.status}"` },
        { status: 400 }
      );
    }

    if (!transition.allowedRoles.includes(dbUser.role)) {
      return NextResponse.json(
        { error: `Role "${dbUser.role}" tidak berwenang untuk mengubah status ini. Diperlukan: ${transition.allowedRoles.join(", ")}` },
        { status: 403 }
      );
    }

    // Require receipt document (Tanda Terima Barang) for goods_delivered
    if (parsed.data.status === "goods_delivered" && !parsed.data.receiptDocumentUrl) {
      return NextResponse.json(
        { error: "Tanda Terima Barang wajib diupload sebelum mengirim barang ke client" },
        { status: 400 }
      );
    }

    // Require invoice upload for invoicing status
    if (parsed.data.status === "invoicing" && !parsed.data.invoiceDocumentUrl && !parsed.data.invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice dan lampiran wajib diupload sebelum proses invoice" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      updatedAt: new Date(),
    };

    // Set additional fields based on status
    if (parsed.data.vendorName) updateData.vendorName = parsed.data.vendorName;
    if (parsed.data.deliveryDate) updateData.deliveryDate = new Date(parsed.data.deliveryDate);

    if (parsed.data.status === "goods_received") {
      updateData.receivedBy = dbUser.id;
      updateData.receivedAt = new Date();
    }
    if (parsed.data.status === "goods_delivered") {
      updateData.goodsDeliveredAt = new Date();
      updateData.receiptDocumentUrl = parsed.data.receiptDocumentUrl;
    }

    // Invoice-related fields
    if (parsed.data.invoiceNumber) updateData.invoiceNumber = parsed.data.invoiceNumber;
    if (parsed.data.invoiceDate) updateData.invoiceDate = new Date(parsed.data.invoiceDate);
    if (parsed.data.invoiceDocumentUrl) updateData.invoiceDocumentUrl = parsed.data.invoiceDocumentUrl;
    if (parsed.data.taxInvoiceNumber) updateData.taxInvoiceNumber = parsed.data.taxInvoiceNumber;
    if (parsed.data.paymentRef) updateData.paymentRef = parsed.data.paymentRef;

    if (parsed.data.status === "payment_received") {
      updateData.paymentDate = new Date();
    }
    if (parsed.data.status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();

    return NextResponse.json({ purchaseOrder: updated });
  } catch (error) {
    console.error("Failed to update PO status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
