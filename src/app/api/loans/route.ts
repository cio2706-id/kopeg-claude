import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, approvals, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateMonthlyInstallment, generateTrackingNumber, LOAN_APPROVAL_STEPS } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { LOAN_COA_MAP } from "@/lib/accurate";

const loanSchema = z.object({
  loanType: z.enum(["reguler", "khusus", "barang", "travel"]),
  amount: z.number().positive(),
  tenorMonths: z.number().int().min(1).max(60),
  purpose: z.string().optional(),
  interestRate: z.number().min(0).max(100).optional(),
});

const INTEREST_RATES: Record<string, number> = {
  reguler: 12,
  khusus: 10,
  barang: 8,
  travel: 10,
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

    // Get or create DB user (same pattern as sync-employee)
    let [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id));

    if (!dbUser) {
      [dbUser] = await db
        .insert(users)
        .values({
          authId: authUser.id,
          email: authUser.email,
          fullName:
            authUser.user_metadata?.full_name ||
            authUser.email.split("@")[0],
          role: "member",
        })
        .returning();
    }

    const body = await request.json();
    const parsed = loanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const interestRate =
      parsed.data.interestRate ?? INTEREST_RATES[parsed.data.loanType];
    const monthlyInstallment = calculateMonthlyInstallment(
      parsed.data.amount,
      interestRate,
      parsed.data.tenorMonths
    );

    const trackingNumber = generateTrackingNumber("LN");
    const coaCode = LOAN_COA_MAP[parsed.data.loanType];

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
        status: "pending_treasury",
        coaCode,
      })
      .returning();

    // Create approval chain per PDF: Staf Treasury → Manager → Bendahara → Ketua
    await db.insert(approvals).values(
      LOAN_APPROVAL_STEPS.map((step) => ({
        referenceType: "loan",
        referenceId: loan.id,
        approverRole: step.role,
        stepOrder: step.order,
        stepLabel: step.label,
      }))
    );

    return NextResponse.json({ loan, trackingNumber });
  } catch (error) {
    console.error("Failed to create loan:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create DB user
    let [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id));

    if (!dbUser) {
      [dbUser] = await db
        .insert(users)
        .values({
          authId: authUser.id,
          email: authUser.email,
          fullName:
            authUser.user_metadata?.full_name ||
            authUser.email.split("@")[0],
          role: "member",
        })
        .returning();
    }

    const userLoans = await db
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
