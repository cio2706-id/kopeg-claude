import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanQuotas } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const quotaSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  loanType: z.enum(["reguler", "khusus", "barang", "travel", "channeling"]),
  quota: z.number().int().min(1).max(999),
});

const TREASURY_ROLES = ["staf_treasury", "manager", "bendahara", "ketua"];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);
    if (!TREASURY_ROLES.includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    const quotas = period
      ? await db.select().from(loanQuotas).where(eq(loanQuotas.period, period))
      : await db.select().from(loanQuotas);

    return NextResponse.json({ quotas });
  } catch (error) {
    console.error("Failed to fetch quotas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);
    if (!TREASURY_ROLES.includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = quotaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    // Check if quota already exists for this period + loanType
    const existing = await db
      .select()
      .from(loanQuotas)
      .where(
        and(
          eq(loanQuotas.period, parsed.data.period),
          eq(loanQuotas.loanType, parsed.data.loanType)
        )
      );

    if (existing.length > 0) {
      // Update existing quota
      const [updated] = await db
        .update(loanQuotas)
        .set({ quota: parsed.data.quota, updatedAt: new Date() })
        .where(eq(loanQuotas.id, existing[0].id))
        .returning();
      return NextResponse.json({ quota: updated });
    }

    // Create new quota
    const [quota] = await db
      .insert(loanQuotas)
      .values({
        period: parsed.data.period,
        loanType: parsed.data.loanType,
        quota: parsed.data.quota,
      })
      .returning();

    return NextResponse.json({ quota });
  } catch (error) {
    console.error("Failed to save quota:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
