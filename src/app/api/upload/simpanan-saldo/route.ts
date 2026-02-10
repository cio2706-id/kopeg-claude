import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { findMemberByIdOrName } from "@/lib/db/find-member";
import { eq, and } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const period = (formData.get("period") as string) || "2025-12";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Find the main data sheet (try common names)
    const sheetNames = workbook.SheetNames;
    let sheetName = sheetNames.find(s =>
      s.toLowerCase().includes("all simpanan") ||
      s.toLowerCase().includes("simpanan") ||
      s.toLowerCase().includes("all")
    ) || sheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    // Detect header row and column mapping
    // Expected: NO.ANGGOTA, NAMA, UNIT KERJA, then savings columns
    let headerRowIdx = -1;
    let colMap = { noAnggota: -1, nama: -1, wajib: -1, pokok: -1, khusus: -1, sukarela: -1, shu: -1, jumlah: -1 };

    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      const rowStr = row.map(c => String(c || "").toLowerCase());

      const noIdx = rowStr.findIndex(c => c.includes("no.anggota") || c.includes("no. anggota") || c.includes("nup"));
      const namaIdx = rowStr.findIndex(c => c.includes("nama"));

      if (noIdx >= 0 && namaIdx >= 0) {
        headerRowIdx = i;
        colMap.noAnggota = noIdx;
        colMap.nama = namaIdx;
        // Find savings columns after nama
        for (let j = namaIdx + 1; j < row.length; j++) {
          const colStr = String(row[j] || "").toLowerCase();
          if (colStr.includes("wajib")) colMap.wajib = j;
          else if (colStr.includes("pokok")) colMap.pokok = j;
          else if (colStr.includes("khusus")) colMap.khusus = j;
          else if (colStr.includes("sukarela")) colMap.sukarela = j;
          else if (colStr.includes("shu")) colMap.shu = j;
          else if (colStr.includes("jumlah") || colStr.includes("total") || colStr.includes("saldo")) colMap.jumlah = j;
        }
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Try simpler detection: look for numeric NO. ANGGOTA in column B
      headerRowIdx = 0;
      colMap = { noAnggota: 1, nama: 2, wajib: 4, pokok: 5, khusus: 6, sukarela: 7, shu: 8, jumlah: 9 };
    }

    const batchId = `simpanan_${period}_${Date.now()}`;
    let processed = 0;
    let skipped = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const noAnggota = row[colMap.noAnggota];
      const nama = row[colMap.nama];

      if (!noAnggota && !nama) continue;
      if (String(nama || "").toLowerCase().includes("jumlah") || String(nama || "").toLowerCase().includes("total")) continue;
      if (String(nama || "").toLowerCase().includes("bukan anggota")) continue;

      const userId = await findMemberByIdOrName(
        noAnggota != null ? String(noAnggota) : null,
        nama != null ? String(nama) : null
      );
      if (!userId) {
        skipped++;
        if (skipped <= 20) errors.push(`Row ${i + 1}: "${nama}" (${noAnggota}) - not found`);
        continue;
      }

      const parseNum = (v: string | number | null) => {
        if (v === null || v === undefined || v === "" || v === "-") return 0;
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,.\s]/g, ""));
        return isNaN(n) ? 0 : n;
      };

      const wajib = parseNum(row[colMap.wajib]);
      const pokok = parseNum(row[colMap.pokok]);
      const khusus = colMap.khusus >= 0 ? parseNum(row[colMap.khusus]) : 0;
      const sukarela = colMap.sukarela >= 0 ? parseNum(row[colMap.sukarela]) : 0;
      const shu = colMap.shu >= 0 ? parseNum(row[colMap.shu]) : 0;
      const jumlah = colMap.jumlah >= 0 ? parseNum(row[colMap.jumlah]) : (wajib + pokok + khusus + sukarela + shu);

      // Upsert: delete existing for this user+period, then insert
      await db.delete(savings).where(
        and(eq(savings.userId, userId), eq(savings.period, period))
      );

      await db.insert(savings).values({
        userId,
        period,
        simpananWajib: wajib.toString(),
        simpananPokok: pokok.toString(),
        simpananKhusus: khusus.toString(),
        simpananSukarela: sukarela.toString(),
        shu: shu.toString(),
        totalBalance: jumlah.toString(),
        uploadBatchId: batchId,
      });

      totalAmount += jumlah;
      processed++;
    }

    // Log the upload
    await db.insert(uploadLogs).values({
      uploadType: "simpanan_saldo",
      period,
      fileName: file.name,
      recordCount: processed,
      totalAmount: totalAmount.toString(),
      uploadedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      totalAmount,
      errors: errors.slice(0, 20),
      batchId,
    });
  } catch (error) {
    console.error("Failed to upload simpanan saldo:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
