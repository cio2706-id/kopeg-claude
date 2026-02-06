import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, poItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePoSchema = z.object({
  status: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  adjustmentNotes: z.string().optional(),
  vendorName: z.string().optional(),
  sppRef: z.string().optional(),
  receiptDocumentUrl: z.string().optional(),
  invoiceNumber: z.string().optional(),
  taxInvoiceNumber: z.string().optional(),
  paymentRef: z.string().optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().min(1),
        description: z.string().optional(),
        quantity: z.number().int().positive(),
        unit: z.string().optional(),
        unitPrice: z.number().positive(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.totalAmount)
      updateData.totalAmount = parsed.data.totalAmount.toString();
    if (parsed.data.adjustmentNotes)
      updateData.adjustmentNotes = parsed.data.adjustmentNotes;
    if (parsed.data.vendorName) updateData.vendorName = parsed.data.vendorName;
    if (parsed.data.sppRef) updateData.sppRef = parsed.data.sppRef;
    if (parsed.data.receiptDocumentUrl)
      updateData.receiptDocumentUrl = parsed.data.receiptDocumentUrl;
    if (parsed.data.invoiceNumber)
      updateData.invoiceNumber = parsed.data.invoiceNumber;
    if (parsed.data.taxInvoiceNumber)
      updateData.taxInvoiceNumber = parsed.data.taxInvoiceNumber;
    if (parsed.data.paymentRef) updateData.paymentRef = parsed.data.paymentRef;

    // Handle status-specific timestamps
    if (parsed.data.status === "goods_received") {
      updateData.receivedAt = new Date();
    } else if (parsed.data.status === "goods_delivered") {
      updateData.goodsDeliveredAt = new Date();
    } else if (parsed.data.status === "invoicing") {
      updateData.invoiceDate = new Date();
    } else if (parsed.data.status === "payment_received") {
      updateData.paymentDate = new Date();
    } else if (parsed.data.status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update items if provided (replace all)
    if (parsed.data.items && parsed.data.items.length > 0) {
      await db.delete(poItems).where(eq(poItems.purchaseOrderId, id));
      await db.insert(poItems).values(
        parsed.data.items.map((item) => ({
          purchaseOrderId: id,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || "pcs",
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
        }))
      );
    }

    return NextResponse.json({ purchaseOrder: updated });
  } catch (error) {
    console.error("Failed to update purchase order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));

    if (!po) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(poItems)
      .where(eq(poItems.purchaseOrderId, id));

    return NextResponse.json({ purchaseOrder: po, items });
  } catch (error) {
    console.error("Failed to fetch purchase order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
