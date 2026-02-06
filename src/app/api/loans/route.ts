import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, approvals, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateMonthlyInstallment, generateTrackingNumber, LOAN_APPROVAL_STEPS } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loanSchema = z.object({
  loanType: z.enum(["regular", "emergency", "education", "housing"]),
  amount: z.number().positive(),
  tenorMonths: z.number().int().min(1).max(60),
  purpose: z.string().optional(),
  interestRate: z.number().min(0).max(100).optional(),
});

const INTEREST_RATES: Record<string, number> = {
  regular: 12,
  emergency: 6,
  education: 10,
  housing: 8,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.userId, dbUser.id));

    return NextResponse.json({ loans: userLoans });
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
