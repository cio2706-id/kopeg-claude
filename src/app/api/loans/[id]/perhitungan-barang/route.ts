import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calculateMonthlyInstallment } from "@/lib/utils";

const perhitunganSchema = z.object({
  amount: z.number().positive(),
  tenorMonths: z.number().int().min(1).max(60),
  interestRate: z.number().min(0).max(100),
  monthlyInstallment: z.number().min(0),
});

/**
 * PATCH: Update a barang loan with the actual goods price and recalculated installment.
 * Only pengurus roles can do this.
 */
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

    // Only pengurus roles can update
    const allowedRoles = [
      "staf_pengadaan",
      "staf_treasury",
      "staf_sekper",
      "staf_piutang",
      "staf_akunting",
      "manager",
      "bendahara",
      "sekertaris",
      "ketua",
    ];
    if (!allowedRoles.includes(dbUser.role)) {
      return NextResponse.json(
        { error: "Hanya pengurus yang dapat mengubah perhitungan pinjaman barang" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = perhitunganSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Get current loan
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    if (!loan) {
      return NextResponse.json(
        { error: "Pinjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    if (loan.loanType !== "barang") {
      return NextResponse.json(
        { error: "Perhitungan ini hanya untuk pinjaman barang" },
        { status: 400 }
      );
    }

    // Don't allow changes after disbursement
    if (loan.status === "disbursed" || loan.status === "selesai") {
      return NextResponse.json(
        { error: "Pinjaman yang sudah dicairkan tidak dapat diubah" },
        { status: 400 }
      );
    }

    const installment = Math.round(
      calculateMonthlyInstallment(
        parsed.data.amount,
        parsed.data.interestRate,
        parsed.data.tenorMonths,
        (loan.interestMethod as "flat" | "efektif" | "sliding") || "flat"
      )
    );

    const [updated] = await db
      .update(loans)
      .set({
        amount: parsed.data.amount.toString(),
        tenorMonths: parsed.data.tenorMonths,
        interestRate: parsed.data.interestRate.toString(),
        monthlyInstallment: installment.toString(),
        updatedAt: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();

    return NextResponse.json({ loan: updated });
  } catch (error) {
    console.error("Failed to update perhitungan barang:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
