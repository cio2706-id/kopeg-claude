import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * PATCH: Update loan status for post-SPP workflow steps.
 * Allowed transitions (by staf_treasury):
 *   bank_process → disbursed (member receives funds)
 */
const statusUpdateSchema = z.object({
  status: z.enum(["bank_process", "disbursed"]),
  bankPortalRef: z.string().optional(),
  notes: z.string().optional(),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  spp_process: ["bank_process"],
  bank_process: ["disbursed"],
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

    // Get current loan
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    if (!loan) {
      return NextResponse.json({ error: "Pinjaman tidak ditemukan" }, { status: 404 });
    }

    // Check allowed transition
    const allowed = ALLOWED_TRANSITIONS[loan.status] || [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Tidak dapat mengubah status dari "${loan.status}" ke "${parsed.data.status}"` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      updatedAt: new Date(),
    };

    if (parsed.data.bankPortalRef) {
      updateData.bankPortalRef = parsed.data.bankPortalRef;
    }

    if (parsed.data.status === "disbursed") {
      updateData.disbursedAt = new Date();
    }

    const [updated] = await db
      .update(loans)
      .set(updateData)
      .where(eq(loans.id, id))
      .returning();

    return NextResponse.json({ loan: updated });
  } catch (error) {
    console.error("Failed to update loan status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
