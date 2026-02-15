import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, approvals } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { calculateMonthlyInstallment, generateTrackingNumber, LOAN_APPROVAL_STEPS } from "@/lib/utils";
import { eq } from "drizzle-orm";
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
        status: isChanneling ? "on_review" : "pending_treasury",
        coaCode,
      })
      .returning();

    // Only create approval chain for non-channeling loans
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

    return NextResponse.json({ loan, trackingNumber, isChanneling });
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
