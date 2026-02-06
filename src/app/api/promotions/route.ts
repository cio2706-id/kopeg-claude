import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const activePromotions = await db
      .select()
      .from(promotions)
      .where(eq(promotions.isActive, true));

    return NextResponse.json({ promotions: activePromotions });
  } catch (error) {
    console.error("Failed to fetch promotions:", error);
    return NextResponse.json({ promotions: [] });
  }
}
