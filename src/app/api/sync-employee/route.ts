import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeData } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { getEmployeeByEmail } from "@/lib/accurate";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    // Fetch from Accurate API
    const employee = await getEmployeeByEmail(authUser.email);

    if (employee) {
      // Check if employee data already exists
      const [existing] = await db
        .select()
        .from(employeeData)
        .where(eq(employeeData.userId, dbUser.id));

      const empValues = {
        userId: dbUser.id,
        accurateEmployeeId: employee.id?.toString(),
        employeeNumber: employee.employeeNo,
        fullName: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        joinDate: employee.joinDate ? new Date(employee.joinDate) : null,
        salary: employee.salary?.toString(),
        bankAccount: employee.bankAccount,
        bankName: employee.bankName,
        rawData: employee as unknown as Record<string, unknown>,
        syncedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(employeeData)
          .set(empValues)
          .where(eq(employeeData.id, existing.id));
      } else {
        await db.insert(employeeData).values(empValues);
      }

      // Sync user fields
      await db
        .update(users)
        .set({
          fullName: employee.name,
          employeeId: employee.employeeNo,
          department: employee.department,
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUser.id));
    }

    return NextResponse.json({ success: true, synced: !!employee });
  } catch (error) {
    console.error("Failed to sync employee data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
