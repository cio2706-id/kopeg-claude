import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, desc } from "drizzle-orm";

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

    const userSavings = await db
      .select()
      .from(savings)
      .where(eq(savings.userId, dbUser.id))
      .orderBy(desc(savings.period));

    return NextResponse.json({ savings: userSavings });
  } catch (error) {
    console.error("Failed to fetch savings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
