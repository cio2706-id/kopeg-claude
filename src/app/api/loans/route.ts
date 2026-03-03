import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, approvals, loanQuotas } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { calculateMonthlyInstallment, generateTrackingNumber, LOAN_APPROVAL_STEPS } from "@/lib/utils";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { LOAN_COA_MAP } from "@/lib/accurate";

const loanSchema = z.object({
  loanType: z.enum(["reguler", "khusus", "barang", "travel", "channeling"]),
  amount: z.number().positive(),
  tenorMonths: z.number().int().min(1).max(60),
  purpose: z.string().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  documentUrls: z.array(z.string()).optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
});

const INTEREST_RATES: Record<string, number> = {
  reguler: 12,
  khusus: 10,
  barang: 8,
  travel: 10,
  channeling: 0,
};

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

    const body = await request.json();
    const parsed = loanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const isChanneling = parsed.data.loanType === "channeling";

    const interestRate =
      parsed.data.interestRate ?? INTEREST_RATES[parsed.data.loanType];
    const monthlyInstallment = isChanneling
      ? 0
      : calculateMonthlyInstallment(
          parsed.data.amount,
          interestRate,
          parsed.data.tenorMonths
        );

    const trackingNumber = generateTrackingNumber("LN");
    const coaCode = LOAN_COA_MAP[parsed.data.loanType] || null;

    // Auto-assign queue number for the current month
    const now = new Date();
    const queuePeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    const [maxQueue] = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${loans.queueNumber}), 0)` })
      .from(loans)
      .where(eq(loans.queuePeriod, queuePeriod));

    const queueNumber = (maxQueue?.maxNum || 0) + 1;

    // Check if quota is already exceeded for this period/type → auto-hold
    let shouldHold = false;
    let holdReason = "";

    if (!isChanneling) {
      const DEFAULT_QUOTAS: Record<string, number> = {
        reguler: 50_000_000,
        khusus: 70_000_000,
      };

      const approvedStatuses = ["approved", "spp_process", "bank_process", "disbursed", "selesai"] as const;
      const usedAmounts = await db
        .select({
          loanType: loans.loanType,
          totalAmount: sql<string>`COALESCE(SUM(${loans.amount}::NUMERIC), 0)`,
        })
        .from(loans)
        .where(
          and(
            eq(loans.queuePeriod, queuePeriod),
            inArray(loans.status, [...approvedStatuses])
          )
        )
        .groupBy(loans.loanType);

      const usedByType: Record<string, number> = {};
      for (const row of usedAmounts) {
        usedByType[row.loanType] = parseFloat(row.totalAmount || "0");
      }

      const periodQuotas = await db
        .select()
        .from(loanQuotas)
        .where(eq(loanQuotas.period, queuePeriod));

      const getQuotaForType = (type: string) => {
        const q = periodQuotas.find((pq) => pq.loanType === type);
        return q ? parseFloat(q.quotaAmount) : (DEFAULT_QUOTAS[type] || 0);
      };

      const loanType = parsed.data.loanType;
      const loanAmount = parsed.data.amount;

      if (loanType === "reguler" || loanType === "khusus") {
        const combinedQuota = getQuotaForType("reguler") + getQuotaForType("khusus");
        const combinedUsed = (usedByType["reguler"] || 0) + (usedByType["khusus"] || 0);
        if (combinedUsed + loanAmount > combinedQuota) {
          shouldHold = true;
          holdReason = `Kuota pinjaman gabungan reguler+khusus bulan ${queuePeriod} telah terlampaui.`;
        }
      } else {
        const ownQuota = getQuotaForType(loanType);
        const ownUsed = usedByType[loanType] || 0;
        if (ownQuota > 0 && ownUsed + loanAmount > ownQuota) {
          shouldHold = true;
          holdReason = `Kuota pinjaman ${loanType} bulan ${queuePeriod} telah terlampaui.`;
        }
      }
    }

    const [loan] = await db
      .insert(loans)
      .values({
        userId: dbUser.id,
        trackingNumber,
        loanType: parsed.data.loanType,
        amount: parsed.data.amount.toString(),
        interestRate: interestRate.toString(),
        tenorMonths: parsed.data.tenorMonths,
        monthlyInstallment: Math.round(monthlyInstallment).toString(),
        purpose: parsed.data.purpose,
        formData: parsed.data.formData || null,
        documentUrls: parsed.data.documentUrls || null,
        status: isChanneling ? "on_review" : shouldHold ? "held" : "pending_treasury",
        coaCode,
        queueNumber,
        queuePeriod,
        holdReason: shouldHold ? holdReason : null,
      })
      .returning();

    // Only create approval chain for non-channeling, non-held loans
    if (!isChanneling) {
      await db.insert(approvals).values(
        LOAN_APPROVAL_STEPS.map((step) => ({
          referenceType: "loan",
          referenceId: loan.id,
          approverRole: step.role,
          stepOrder: step.order,
          stepLabel: step.label,
        }))
      );
    }

    return NextResponse.json({ loan, trackingNumber, isChanneling, held: shouldHold });
  } catch (error) {
    console.error("Failed to create loan:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    // Pengurus pages pass ?view=all to see ALL loans
    // Otherwise, non-member roles see all, members see only their own
    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get("view") === "all";

    const userLoans =
      viewAll || dbUser.role !== "member"
        ? await db.select().from(loans)
        : await db
            .select()
            .from(loans)
            .where(eq(loans.userId, dbUser.id));

    return NextResponse.json({ loans: userLoans });
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
