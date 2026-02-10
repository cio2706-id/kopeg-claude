import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await db
      .select()
      .from(uploadLogs)
      .orderBy(sql`${uploadLogs.createdAt} DESC`)
      .limit(50);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch upload logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
