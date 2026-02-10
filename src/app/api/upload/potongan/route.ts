import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savings, loanBalances, monthlyDeductions, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { findMemberByIdOrName } from "@/lib/db/find-member";
import { eq, and, sql } from "drizzle-orm";
import * as XLSX from "xlsx";

// Parsing configs per source file type
const SOURCE_CONFIGS: Record<string, {
  sheetName: string | string[];
  nupCol?: number;
  nameCol: number;
  simpananCols: number[]; // columns to sum for simpanan
  pinjamanCol: number;
  dataStartRow: number;
  headerRow?: number;
}> = {
  bki_tetap: {
    sheetName: "ALL",
    nupCol: 0, // A = NUP
    nameCol: 1, // B = Nama Pegawai
    simpananCols: [6], // G = Simpanan Kop
    pinjamanCol: 7, // H = Pinjaman Kop
    dataStartRow: 1,
  },
  ids: {
    sheetName: ["IDS - Januari", "IDS"],
    nupCol: 1, // B = NUP
    nameCol: 2, // C = Nama Pegawai
    simpananCols: [6], // G = SIKOP
    pinjamanCol: 7, // H = PINJAMAN
    dataStartRow: 6,
    headerRow: 5,
  },
  kontrak_mns: {
    sheetName: "DAFTAR KONTRAK KERJA",
    nameCol: 1, // B = NAMA
    simpananCols: [2, 3], // C = Simpanan Wajib, D = Simpanan Pokok
    pinjamanCol: 4, // E = Pinjaman
    dataStartRow: 7,
  },
  sbu_industri: {
    sheetName: "DAFTAR",
    nameCol: 1, // B = NAMA
    simpananCols: [2, 3], // C = Simpanan Wajib, D = Simpanan Pokok
    pinjamanCol: 4, // E = Pinjaman
    dataStartRow: 7,
  },
  sbu_energi: {
    sheetName: "DAFTAR",
    nameCol: 1, // B = NAMA
    simpananCols: [2, 3], // C = Simpanan Wajib, D = Simpanan Pokok
    pinjamanCol: 4, // E = Pinjaman
    dataStartRow: 7,
  },
};

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
    const sourceType = (formData.get("sourceType") as string) || "";
    const period = (formData.get("period") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!sourceType || !SOURCE_CONFIGS[sourceType]) {
      return NextResponse.json(
        { error: `Invalid source type. Valid: ${Object.keys(SOURCE_CONFIGS).join(", ")}` },
        { status: 400 }
      );
    }
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ error: "Period required (YYYY-MM)" }, { status: 400 });
    }

    const config = SOURCE_CONFIGS[sourceType];
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Find sheet
    const sheetNames = Array.isArray(config.sheetName) ? config.sheetName : [config.sheetName];
    let sheet: XLSX.WorkSheet | null = null;
    let usedSheetName = "";
    for (const sn of sheetNames) {
      const found = workbook.SheetNames.find(s =>
        s.toLowerCase().includes(sn.toLowerCase())
      );
      if (found) {
        sheet = workbook.Sheets[found];
        usedSheetName = found;
        break;
      }
    }

    if (!sheet) {
      return NextResponse.json(
        { error: `Sheet not found. Available: ${workbook.SheetNames.join(", ")}` },
        { status: 400 }
      );
    }

    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    const batchId = `potongan_${sourceType}_${period}_${Date.now()}`;
    let processed = 0;
    let skipped = 0;
    let totalSimpanan = 0;
    let totalPinjaman = 0;
    const errors: string[] = [];

    const parseNum = (v: string | number | null | undefined) => {
      if (v === null || v === undefined || v === "" || v === "-") return 0;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,\s]/g, ""));
      return isNaN(n) ? 0 : Math.abs(n);
    };

    for (let i = config.dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const nup = config.nupCol !== undefined ? row[config.nupCol] : null;
      const name = row[config.nameCol];

      if (!nup && !name) continue;
      const nameStr = String(name || "").trim();
      if (!nameStr) continue;
      if (nameStr.toLowerCase().includes("jumlah") || nameStr.toLowerCase().includes("total")) continue;
      if (nameStr.toLowerCase() === "nama" || nameStr.toLowerCase() === "nama pegawai") continue;

      // Sum simpanan columns
      const simpanan = config.simpananCols.reduce((sum, col) => sum + parseNum(row[col]), 0);
      const pinjaman = parseNum(row[config.pinjamanCol]);

      if (simpanan === 0 && pinjaman === 0) continue;

      const userId = await findMemberByIdOrName(nup, nameStr);
      if (!userId) {
        skipped++;
        if (skipped <= 20) errors.push(`Row ${i + 1}: "${nameStr}" (${nup || "no NUP"}) - not found`);
        continue;
      }

      // Record the monthly deduction
      await db.insert(monthlyDeductions).values({
        userId,
        period,
        sourceFile: sourceType,
        simpananAmount: simpanan.toString(),
        pinjamanAmount: pinjaman.toString(),
        uploadBatchId: batchId,
      });

      // Update savings: add simpanan to the latest balance
      if (simpanan > 0) {
        const [existing] = await db
          .select()
          .from(savings)
          .where(eq(savings.userId, userId))
          .orderBy(sql`${savings.period} DESC`)
          .limit(1);

        if (existing) {
          const newTotal = parseFloat(existing.totalBalance || "0") + simpanan;
          const newWajib = parseFloat(existing.simpananWajib || "0") + simpanan;
          await db.update(savings).set({
            simpananWajib: newWajib.toString(),
            totalBalance: newTotal.toString(),
            updatedAt: new Date(),
          }).where(eq(savings.id, existing.id));
        }
      }

      // Update loan balances: subtract pinjaman from all active loans proportionally
      if (pinjaman > 0) {
        const activeLoanBalances = await db
          .select()
          .from(loanBalances)
          .where(eq(loanBalances.userId, userId));

        const totalLoanSaldo = activeLoanBalances.reduce(
          (sum, lb) => sum + parseFloat(lb.saldo || "0"), 0
        );

        if (totalLoanSaldo > 0) {
          // Distribute deduction proportionally across loan types
          for (const lb of activeLoanBalances) {
            const lbSaldo = parseFloat(lb.saldo || "0");
            if (lbSaldo <= 0) continue;
            const proportion = lbSaldo / totalLoanSaldo;
            const deduction = Math.min(pinjaman * proportion, lbSaldo);
            const newSaldo = Math.max(0, lbSaldo - deduction);

            await db.update(loanBalances).set({
              saldo: newSaldo.toString(),
              updatedAt: new Date(),
            }).where(eq(loanBalances.id, lb.id));
          }
        }
      }

      totalSimpanan += simpanan;
      totalPinjaman += pinjaman;
      processed++;
    }

    // Log the upload
    await db.insert(uploadLogs).values({
      uploadType: "potongan_bulanan",
      period,
      fileName: file.name,
      subType: sourceType,
      recordCount: processed,
      totalAmount: (totalSimpanan + totalPinjaman).toString(),
      uploadedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      totalSimpanan,
      totalPinjaman,
      sheet: usedSheetName,
      errors: errors.slice(0, 20),
      batchId,
    });
  } catch (error) {
    console.error("Failed to upload potongan:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
