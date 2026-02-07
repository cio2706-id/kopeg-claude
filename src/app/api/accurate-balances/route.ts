import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeData } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLoanBalancesByCoa } from "@/lib/accurate";
import { eq } from "drizzle-orm";

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

    // Get employee name from employee_data
    const [empData] = await db
      .select()
      .from(employeeData)
      .where(eq(employeeData.userId, dbUser.id));

    const employeeName = empData?.fullName || dbUser.fullName;

    // Fetch balances from Accurate for Piutang-Pinjaman (COA 110304-110307)
    const balances = await getLoanBalancesByCoa(employeeName);

    return NextResponse.json({ balances, employeeName });
  } catch (error) {
    console.error("Failed to fetch Accurate balances:", error);
    // Return zero balances instead of 500 so dashboard still renders
    return NextResponse.json({
      balances: { reguler: 0, khusus: 0, barang: 0, travel: 0 },
      employeeName: "",
      error: error instanceof Error ? error.message : "Failed to fetch",
    });
  }
}
