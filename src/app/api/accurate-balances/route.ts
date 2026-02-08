import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employeeData, loans } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { getLoanBalancesByCoa } from "@/lib/accurate";
import { eq, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    // Get employee name from employee_data
    const [empData] = await db
      .select()
      .from(employeeData)
      .where(eq(employeeData.userId, dbUser.id));

    const employeeName = empData?.fullName || dbUser.fullName;

    // ─── Primary: Calculate loan balances from DB ──────────────────────
    // Sum active loan amounts per loan_type for this user
    const dbBalances: Record<string, number> = {
      reguler: 0,
      khusus: 0,
      barang: 0,
      travel: 0,
    };

    // Only count fully approved/disbursed loans in balance
    // Approved statuses: approved, spp_process, bank_process, disbursed
    const userLoans = await db
      .select({
        loanType: loans.loanType,
        totalAmount: sql<string>`sum(${loans.amount})`,
      })
      .from(loans)
      .where(
        and(
          eq(loans.userId, dbUser.id),
          inArray(loans.status, ["approved", "spp_process", "bank_process", "disbursed"])
        )
      )
      .groupBy(loans.loanType);

    for (const row of userLoans) {
      if (row.loanType in dbBalances) {
        dbBalances[row.loanType] = parseFloat(row.totalAmount) || 0;
      }
    }

    // ─── Supplementary: Try Accurate API (non-blocking) ───────────────
    let accurateBalances: Record<string, number> | null = null;
    let accurateError: string | null = null;

    try {
      accurateBalances = await getLoanBalancesByCoa(employeeName);
    } catch (error) {
      accurateError = error instanceof Error ? error.message : "Accurate API failed";
      console.error("[accurate-balances] Accurate API error:", accurateError);
    }

    // Use DB balances as primary, Accurate as supplementary info
    // If Accurate has non-zero values, use them (they represent GL truth)
    // Otherwise fall back to DB-calculated balances
    const balances = { ...dbBalances };
    if (accurateBalances) {
      for (const [type, val] of Object.entries(accurateBalances)) {
        if (val > 0) {
          balances[type] = val;
        }
      }
    }

    return NextResponse.json({
      balances,
      employeeName,
      source: accurateBalances ? "accurate+db" : "db",
      dbBalances,
      accurateBalances,
      accurateError,
    });
  } catch (error) {
    console.error("Failed to fetch balances:", error);
    return NextResponse.json({
      balances: { reguler: 0, khusus: 0, barang: 0, travel: 0 },
      employeeName: "",
      source: "error",
      error: error instanceof Error ? error.message : "Failed to fetch",
    });
  }
}
