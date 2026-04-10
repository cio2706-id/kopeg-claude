import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, users, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";

// Insert savings rows in chunks to avoid hitting Postgres bind-param limits.
const INSERT_CHUNK_SIZE = 500;

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
    const sheetName = sheetNames.find(s =>
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
    // Some Excel files use multi-row headers (e.g. Row 0 has merged cells, Row 1 has sub-columns)
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

        // Scan this row AND subsequent rows for savings column names (handles multi-row headers)
        const scanRows = [i];
        // Check up to 3 rows below for sub-header columns
        for (let sub = 1; sub <= 3; sub++) {
          if (i + sub < data.length) scanRows.push(i + sub);
        }

        for (const ri of scanRows) {
          const scanRow = data[ri];
          if (!scanRow) continue;
          let foundNewCols = false;
          for (let j = namaIdx + 1; j < scanRow.length; j++) {
            const colStr = String(scanRow[j] || "").toLowerCase().trim();
            if (!colStr) continue;
            // Match specific savings columns - use exact-ish matching to avoid false positives
            if (colStr.includes("wajib") && colMap.wajib === -1) { colMap.wajib = j; foundNewCols = true; }
            else if (colStr.includes("pokok") && colMap.pokok === -1) { colMap.pokok = j; foundNewCols = true; }
            else if (colStr.includes("khusus") && !colStr.includes("sukarela") && colMap.khusus === -1) { colMap.khusus = j; foundNewCols = true; }
            else if (colStr.includes("sukarela") && !colStr.includes("berjangka") && colMap.sukarela === -1) { colMap.sukarela = j; foundNewCols = true; }
            else if (colStr.includes("shu") && colMap.shu === -1) { colMap.shu = j; foundNewCols = true; }
            else if ((colStr === "jumlah" || colStr === "total" || colStr === "saldo") && colMap.jumlah === -1) { colMap.jumlah = j; foundNewCols = true; }
          }
          // If we found savings columns in a sub-header row, update headerRowIdx to that row
          if (foundNewCols && ri > headerRowIdx) {
            headerRowIdx = ri;
          }
        }
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Try simpler detection: look for numeric NO. ANGGOTA in column B
      headerRowIdx = 0;
      colMap = { noAnggota: 1, nama: 2, wajib: 4, pokok: 5, khusus: 6, sukarela: 7, shu: 8, jumlah: 9 };
    }

    // ── Pre-fetch all users once to avoid N+1 queries ───────────────────────
    // The previous implementation ran 3 DB queries per row (find user, delete,
    // insert), which pushed large uploads past the 5-minute mark. We now load
    // the user table once and resolve matches in-memory.
    const allUsers = await db
      .select({
        id: users.id,
        employeeId: users.employeeId,
        fullName: users.fullName,
      })
      .from(users);

    const byEmployeeId = new Map<string, string>();
    const byFullNameLower = new Map<string, string>();
    for (const u of allUsers) {
      if (u.employeeId) {
        byEmployeeId.set(u.employeeId.trim(), u.id);
      }
      if (u.fullName) {
        byFullNameLower.set(u.fullName.trim().toLowerCase(), u.id);
      }
    }

    const parseNum = (v: string | number | null) => {
      if (v === null || v === undefined || v === "" || v === "-") return 0;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,.\s]/g, ""));
      return isNaN(n) ? 0 : n;
    };

    const batchId = `simpanan_${period}_${Date.now()}`;
    const rowsToInsert: Array<typeof savings.$inferInsert> = [];
    const processedUserIds = new Set<string>();
    let skipped = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const noAnggota = row[colMap.noAnggota];
      const nama = row[colMap.nama];

      if (!noAnggota && !nama) continue;
      const namaLower = String(nama || "").toLowerCase();
      if (namaLower.includes("jumlah") || namaLower.includes("total")) continue;
      if (namaLower.includes("bukan anggota")) continue;

      // Resolve user: employeeId first, then fullName (case-insensitive)
      let userId: string | undefined;
      if (noAnggota != null) {
        const id = String(noAnggota).trim();
        if (id) userId = byEmployeeId.get(id);
      }
      if (!userId && nama != null) {
        const cleanName = String(nama).trim();
        if (cleanName && cleanName.length > 2) {
          userId = byFullNameLower.get(cleanName.toLowerCase());
        }
      }

      if (!userId) {
        skipped++;
        if (skipped <= 20) errors.push(`Row ${i + 1}: "${nama}" (${noAnggota}) - not found`);
        continue;
      }

      // If a file has two rows for the same user, keep the last one (same
      // semantics as the previous per-row delete-then-insert loop).
      if (processedUserIds.has(userId)) {
        const existingIdx = rowsToInsert.findIndex((r) => r.userId === userId);
        if (existingIdx >= 0) rowsToInsert.splice(existingIdx, 1);
      }
      processedUserIds.add(userId);

      const wajib = parseNum(row[colMap.wajib]);
      const pokok = parseNum(row[colMap.pokok]);
      const khusus = colMap.khusus >= 0 ? parseNum(row[colMap.khusus]) : 0;
      const sukarela = colMap.sukarela >= 0 ? parseNum(row[colMap.sukarela]) : 0;
      const shu = colMap.shu >= 0 ? parseNum(row[colMap.shu]) : 0;
      const jumlah = colMap.jumlah >= 0 ? parseNum(row[colMap.jumlah]) : (wajib + pokok + khusus + sukarela + shu);

      rowsToInsert.push({
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
    }

    // ── Bulk upsert in a single transaction ──────────────────────────────────
    // Delete existing rows for the matched users in this period, then bulk
    // insert the new rows in chunks. This replaces ~3N round-trips with a
    // handful of round-trips regardless of file size.
    if (rowsToInsert.length > 0) {
      const userIds = Array.from(processedUserIds);
      await db.transaction(async (tx) => {
        await tx
          .delete(savings)
          .where(
            and(
              eq(savings.period, period),
              inArray(savings.userId, userIds)
            )
          );

        for (let i = 0; i < rowsToInsert.length; i += INSERT_CHUNK_SIZE) {
          const chunk = rowsToInsert.slice(i, i + INSERT_CHUNK_SIZE);
          await tx.insert(savings).values(chunk);
        }
      });
    }

    // Log the upload
    await db.insert(uploadLogs).values({
      uploadType: "simpanan_saldo",
      period,
      fileName: file.name,
      recordCount: rowsToInsert.length,
      totalAmount: totalAmount.toString(),
      uploadedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      processed: rowsToInsert.length,
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
