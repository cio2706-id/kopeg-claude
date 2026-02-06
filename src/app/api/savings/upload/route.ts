import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

    const batchId = uuidv4();
    const period = formData.get("period") as string || new Date().toISOString().slice(0, 7);
    let processed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const employeeId = String(row["employee_id"] || row["NIP"] || "");
      const simpananPokok = Number(row["simpanan_pokok"] || row["Simpanan Pokok"] || 0);
      const simpananWajib = Number(row["simpanan_wajib"] || row["Simpanan Wajib"] || 0);
      const simpananSukarela = Number(row["simpanan_sukarela"] || row["Simpanan Sukarela"] || 0);

      if (!employeeId) {
        errors.push(`Row skipped: missing employee_id`);
        continue;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, employeeId));

      if (!user) {
        errors.push(`Employee ${employeeId} not found`);
        continue;
      }

      const total = simpananPokok + simpananWajib + simpananSukarela;

      await db.insert(savings).values({
        userId: user.id,
        period,
        simpananPokok: simpananPokok.toString(),
        simpananWajib: simpananWajib.toString(),
        simpananSukarela: simpananSukarela.toString(),
        totalBalance: total.toString(),
        uploadBatchId: batchId,
      });

      processed++;
    }

    return NextResponse.json({
      message: `Processed ${processed} records`,
      batchId,
      processed,
      errors,
    });
  } catch (error) {
    console.error("Failed to upload savings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
