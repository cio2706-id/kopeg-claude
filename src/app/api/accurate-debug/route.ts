import { NextResponse } from "next/server";
import { debugAccurateConnection } from "@/lib/accurate";

export async function GET() {
  const result = await debugAccurateConnection();
  return NextResponse.json(result);
}
