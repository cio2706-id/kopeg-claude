import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { gte } from "drizzle-orm";

export async function GET() {
  try {
    const events = await db
      .select()
      .from(calendarEvents)
      .where(gte(calendarEvents.eventDate, new Date()));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return NextResponse.json({ events: [] });
  }
}
