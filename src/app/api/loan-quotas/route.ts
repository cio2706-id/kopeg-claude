import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanQuotas, loans } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

// Default quota amounts (in Rupiah)
const DEFAULT_QUOTAS: Record<string, number> = {
  reguler: 50_000_000,
  khusus: 70_000_000,
};

const quotaSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  loanType: z.enum(["reguler", "khusus", "barang", "travel", "kepemilikan_kendaraan", "channeling"]),
  quotaAmount: z.number().min(0), // Rupiah amount
});

// Roles that can VIEW quotas - only Bendahara
const VIEW_ROLES = ["bendahara"];
// Roles that can SET/MODIFY quotas - only Bendahara
const SET_ROLES = ["bendahara"];

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
    if (!VIEW_ROLES.includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    const quotas = period
      ? await db.select().from(loanQuotas).where(eq(loanQuotas.period, period))
      : await db.select().from(loanQuotas);

    // Calculate actual used amounts from approved loans
    if (period) {
      const approvedStatuses = ["approved", "spp_process", "bank_process", "disbursed", "selesai"] as const;
      const approvedLoans = await db
        .select({
          loanType: loans.loanType,
          totalAmount: sql<string>`COALESCE(SUM(${loans.amount}::NUMERIC), 0)`,
        })
        .from(loans)
        .where(
          and(
            eq(loans.queuePeriod, period),
            inArray(loans.status, [...approvedStatuses])
          )
        )
        .groupBy(loans.loanType);

      const usedByType: Record<string, number> = {};
      for (const row of approvedLoans) {
        usedByType[row.loanType] = parseFloat(row.totalAmount || "0");
      }

      // Enrich quotas with real-time used amounts
      const enrichedQuotas = quotas.map((q) => ({
        ...q,
        usedAmount: (usedByType[q.loanType] || 0).toString(),
      }));

      // Calculate cross-quota info for reguler/khusus
      const regulerQuota = quotas.find((q) => q.loanType === "reguler");
      const khususQuota = quotas.find((q) => q.loanType === "khusus");
      const regulerQuotaAmt = parseFloat(regulerQuota?.quotaAmount || DEFAULT_QUOTAS.reguler.toString());
      const khususQuotaAmt = parseFloat(khususQuota?.quotaAmount || DEFAULT_QUOTAS.khusus.toString());
      const regulerUsed = usedByType["reguler"] || 0;
      const khususUsed = usedByType["khusus"] || 0;
      const combinedQuota = regulerQuotaAmt + khususQuotaAmt;
      const combinedUsed = regulerUsed + khususUsed;

      return NextResponse.json({
        quotas: enrichedQuotas,
        crossQuota: {
          regulerQuota: regulerQuotaAmt,
          khususQuota: khususQuotaAmt,
          regulerUsed,
          khususUsed,
          combinedQuota,
          combinedUsed,
          combinedRemaining: combinedQuota - combinedUsed,
        },
        canSetQuota: SET_ROLES.includes(dbUser.role),
      });
    }

    return NextResponse.json({
      quotas,
      canSetQuota: SET_ROLES.includes(dbUser.role),
    });
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

    // Only Manager, Bendahara, Ketua can set quotas
    if (!SET_ROLES.includes(dbUser.role)) {
      return NextResponse.json(
        { error: "Hanya Bendahara yang dapat mengatur kuota pinjaman" },
        { status: 403 }
      );
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
        .set({ quotaAmount: parsed.data.quotaAmount.toString(), updatedAt: new Date() })
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
        quotaAmount: parsed.data.quotaAmount.toString(),
      })
      .returning();

    return NextResponse.json({ quota });
  } catch (error) {
    console.error("Failed to save quota:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
