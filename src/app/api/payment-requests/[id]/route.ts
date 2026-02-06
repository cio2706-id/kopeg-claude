import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "in_review", "adjusted", "approved", "rejected", "completed"]).optional(),
  adjustedAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.adjustedAmount) updateData.adjustedAmount = parsed.data.adjustedAmount.toString();
    if (parsed.data.notes) updateData.notes = parsed.data.notes;

    const [updated] = await db
      .update(paymentRequests)
      .set(updateData)
      .where(eq(paymentRequests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ paymentRequest: updated });
  } catch (error) {
    console.error("Failed to update payment request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
