import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanBalances, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { findMemberByIdOrName } from "@/lib/db/find-member";
import { eq, and } from "drizzle-orm";
import * as XLSX from "xlsx";

// Column mapping per loan type based on actual Excel analysis
const LOAN_TYPE_CONFIGS: Record<string, {
  sheetName: string | string[];
  nameCol: number;
  saldoCol: number;
  dataStartRow: number;
  sections?: { name: string; startRow: number; endRow?: number }[];
}> = {
  channeling: {
    sheetName: "REKAP PIUTANG BANK",
    nameCol: 1, // B
    saldoCol: 30, // AE = "Piutang" (Saldo 2025)
    dataStartRow: 3,
    sections: [
      { name: "channeling_mandiri", startRow: 3, endRow: 27 },
      { name: "channeling_bsi", startRow: 32 },
    ],
  },
  khusus: {
    sheetName: "PIUTANG KHUSUS",
    nameCol: 1, // B
    saldoCol: 56, // BE = "Saldo Piutang Khusus 2025"
    dataStartRow: 4,
  },
  reguler: {
    sheetName: ["REKAP PIUTANG REGULER", "PIUTANG REGULER"],
    nameCol: 1, // B
    saldoCol: 54, // BC = "SALDO HUTANG PIUTANG 2025"
    dataStartRow: 4,
  },
  barang: {
    sheetName: "Kertas Kerja",
    nameCol: 1, // B
    saldoCol: 29, // AD = "Saldo per 2025"
    dataStartRow: 4,
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
    const loanType = (formData.get("loanType") as string) || "";
    const period = (formData.get("period") as string) || "2025-12";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!loanType || !LOAN_TYPE_CONFIGS[loanType]) {
      return NextResponse.json(
        { error: `Invalid loan type. Valid: ${Object.keys(LOAN_TYPE_CONFIGS).join(", ")}` },
        { status: 400 }
      );
    }

    const config = LOAN_TYPE_CONFIGS[loanType];
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Find the right sheet
    const sheetNames = Array.isArray(config.sheetName) ? config.sheetName : [config.sheetName];
    let sheet: XLSX.WorkSheet | null = null;
    let usedSheetName = "";
    for (const sn of sheetNames) {
      const found = workbook.SheetNames.find(s => s.toLowerCase().includes(sn.toLowerCase()));
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

    const batchId = `pinjaman_${loanType}_${period}_${Date.now()}`;
    let processed = 0;
    let skipped = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    const parseNum = (v: string | number | null | undefined) => {
      if (v === null || v === undefined || v === "" || v === "-") return 0;
      if (typeof v === "string" && v.toLowerCase().includes("lunas")) return 0;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,\s]/g, ""));
      return isNaN(n) ? 0 : Math.abs(n);
    };

    async function processRow(row: (string | number | null)[], rowIdx: number, subType: string) {
      const name = row[config.nameCol];
      if (!name) return;
      const nameStr = String(name).trim();
      if (!nameStr || nameStr.toLowerCase().includes("jumlah") || nameStr.toLowerCase().includes("total") || nameStr.toLowerCase() === "nama") return;

      const saldo = parseNum(row[config.saldoCol]);
      if (saldo <= 0) return; // Skip zero/negative balances

      const userId = await findMemberByIdOrName(null, nameStr);
      if (!userId) {
        skipped++;
        if (skipped <= 20) errors.push(`Row ${rowIdx + 1}: "${nameStr}" - not found`);
        return;
      }

      // Upsert: delete existing for this user+type+period
      await db.delete(loanBalances).where(
        and(
          eq(loanBalances.userId, userId),
          eq(loanBalances.loanType, subType),
          eq(loanBalances.period, period)
        )
      );

      await db.insert(loanBalances).values({
        userId,
        loanType: subType,
        period,
        saldo: saldo.toString(),
        uploadBatchId: batchId,
      });

      totalAmount += saldo;
      processed++;
    }

    if (config.sections) {
      // Process multiple sections (e.g., Mandiri and BSI)
      for (const section of config.sections) {
        const endRow = section.endRow || data.length;
        for (let i = section.startRow; i < endRow; i++) {
          const row = data[i];
          if (!row) continue;
          await processRow(row, i, section.name);
        }
      }
    } else {
      // Single section
      for (let i = config.dataStartRow; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        await processRow(row, i, loanType);
      }
    }

    // Log the upload
    await db.insert(uploadLogs).values({
      uploadType: "pinjaman_saldo",
      period,
      fileName: file.name,
      subType: loanType,
      recordCount: processed,
      totalAmount: totalAmount.toString(),
      uploadedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      totalAmount,
      sheet: usedSheetName,
      errors: errors.slice(0, 20),
      batchId,
    });
  } catch (error) {
    console.error("Failed to upload pinjaman saldo:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
