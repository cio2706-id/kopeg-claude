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

    // Get employee name from employee_data
    const [empData] = await db
      .select()
      .from(employeeData)
      .where(eq(employeeData.userId, dbUser.id));

    const employeeName = empData?.fullName || dbUser.fullName;

    // Fetch balances from Accurate by COA codes
    const balances = await getLoanBalancesByCoa(employeeName);

    return NextResponse.json({ balances, employeeName });
  } catch (error) {
    console.error("Failed to fetch Accurate balances:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
