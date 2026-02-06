import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentRequests, approvals, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateTrackingNumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const trackingNumber = generateTrackingNumber();

    const [paymentRequest] = await db
      .insert(paymentRequests)
      .values({
        userId: user.id,
        trackingNumber,
        description: parsed.data.description,
        amount: parsed.data.amount.toString(),
        category: parsed.data.category,
        status: "pending",
      })
      .returning();

    // Create approval records for the approval chain
    const approvalSteps = [
      { role: "staf_treasury" as const, order: 1 },
      { role: "manager" as const, order: 2 },
      { role: "bendahara" as const, order: 3 },
    ];

    await db.insert(approvals).values(
      approvalSteps.map((step) => ({
        referenceType: "payment_request",
        referenceId: paymentRequest.id,
        approverRole: step.role,
        stepOrder: step.order,
      }))
    );

    return NextResponse.json({
      trackingNumber: paymentRequest.trackingNumber,
      id: paymentRequest.id,
    });
  } catch (error) {
    console.error("Failed to create payment request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get("tracking");

    if (trackingNumber) {
      const [result] = await db
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.trackingNumber, trackingNumber));

      if (!result) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const approvalRecords = await db
        .select()
        .from(approvals)
        .where(eq(approvals.referenceId, result.id));

      return NextResponse.json({ paymentRequest: result, approvals: approvalRecords });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.userId, user.id));

    return NextResponse.json({ paymentRequests: results });
  } catch (error) {
    console.error("Failed to fetch payment requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
