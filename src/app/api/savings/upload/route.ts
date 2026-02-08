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

    // Parse as array of arrays to handle the Excel's specific format
    // (title rows 1-6, data from row 7 onwards)
    const allRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: null,
    });

    const batchId = uuidv4();
    const period =
      (formData.get("period") as string) ||
      new Date().toISOString().slice(0, 7);
    let processed = 0;
    const errors: string[] = [];

    // Data rows start at index 6 (row 7 in Excel, after title + headers)
    for (let i = 6; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || !row[0]) continue; // Skip empty rows

      const noAnggota = String(row[1] || "").trim(); // Column B: NO. ANGGOTA
      const namaAnggota = String(row[2] || "").trim(); // Column C: NAMA ANGGOTA
      const unitKerja = String(row[3] || "").trim(); // Column D: UNIT KERJA
      const pokok = Number(row[4]) || 0; // Column E: POKOK
      const wajib = Number(row[5]) || 0; // Column F: WAJIB
      const khusus = Number(row[6]) || 0; // Column G: KHUSUS
      const sukarela = Number(row[7]) || 0; // Column H: SUKARELA
      const shu = Number(row[8]) || 0; // Column I: SHU
      const jumlah = Number(row[9]) || 0; // Column J: JUMLAH
      const status = String(row[10] || "").trim(); // Column K: STATUS

      if (!noAnggota || !namaAnggota) continue;
      if (status === "BUKAN ANGGOTA") continue;

      // Try to find user by employeeId (NO. ANGGOTA) or email pattern
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, noAnggota));

      if (!user) {
        // Try email pattern: {employeeNumber}@kopeg-bki.id
        const email = `${noAnggota}@kopeg-bki.id`;
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));
      }

      if (!user) {
        errors.push(`Row ${i + 1}: Anggota ${noAnggota} (${namaAnggota}) not found in DB`);
        continue;
      }

      const total = jumlah || pokok + wajib + khusus + sukarela + shu;

      await db.insert(savings).values({
        userId: user.id,
        period,
        simpananPokok: pokok.toString(),
        simpananWajib: wajib.toString(),
        simpananKhusus: khusus.toString(),
        simpananSukarela: sukarela.toString(),
        shu: shu.toString(),
        totalBalance: total.toString(),
        uploadBatchId: batchId,
      });

      processed++;
    }

    return NextResponse.json({
      message: `Processed ${processed} records`,
      batchId,
      processed,
      errors: errors.slice(0, 50), // Limit errors to first 50
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error("Failed to upload savings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
