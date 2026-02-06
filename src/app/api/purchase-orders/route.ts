import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, poItems, approvals, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateTrackingNumber, generatePoNumber, PO_APPROVAL_STEPS } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createPoSchema = z.object({
  description: z.string().min(1),
  estimatedAmount: z.number().positive().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, user.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createPoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const trackingNumber = generateTrackingNumber("PO");
    const poNumber = generatePoNumber();

    const [po] = await db
      .insert(purchaseOrders)
      .values({
        userId: dbUser.id,
        trackingNumber,
        poNumber,
        description: parsed.data.description,
        estimatedAmount: parsed.data.estimatedAmount?.toString(),
        status: "submitted",
      })
      .returning();

    // Insert PO items if provided
    if (parsed.data.items && parsed.data.items.length > 0) {
      await db.insert(poItems).values(
        parsed.data.items.map((item) => ({
          purchaseOrderId: po.id,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || "pcs",
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
        }))
      );
    }

    // Create approval records: Staf Pengadaan → Manager
    await db.insert(approvals).values(
      PO_APPROVAL_STEPS.map((step) => ({
        referenceType: "purchase_order",
        referenceId: po.id,
        approverRole: step.role,
        stepOrder: step.order,
        stepLabel: step.label,
      }))
    );

    return NextResponse.json({
      trackingNumber: po.trackingNumber,
      poNumber: po.poNumber,
      id: po.id,
    });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get("tracking");

    if (trackingNumber) {
      const [result] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.trackingNumber, trackingNumber));

      if (!result) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const items = await db
        .select()
        .from(poItems)
        .where(eq(poItems.purchaseOrderId, result.id));

      const approvalRecords = await db
        .select()
        .from(approvals)
        .where(eq(approvals.referenceId, result.id));

      return NextResponse.json({
        purchaseOrder: result,
        items,
        approvals: approvalRecords,
      });
    }

    // List all POs (for pengurus)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allPOs = await db.select().from(purchaseOrders);
    return NextResponse.json({ purchaseOrders: allPOs });
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
