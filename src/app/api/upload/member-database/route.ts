import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeData, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";

/**
 * Upload member database from "DATA ANGGOTA KOPERASI UPDATE.xlsx"
 * Sheet "ALL" columns:
 *   A(0): NUP, B(1): Nama, C(2): Perusahaan, D(3): Departemen,
 *   E(4): Unit Penempatan, F(5): Jabatan, G(6): EMAIL,
 *   H(7): STATUS (AKTIF/PASIF), I(8): Simpanan, J(9): Pinjaman
 *
 * Strategy: Clean replace of existing member data.
 * - Pengurus (non-member roles) are NOT affected.
 * - Old members with no financial data are DELETED to avoid duplicates.
 * - Old members with financial data are updated in place.
 * - New members from Excel are inserted fresh.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await getOrCreateUser(authUser);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Find the "ALL" sheet
    const sheetName = workbook.SheetNames.find(
      (s) => s.toUpperCase() === "ALL"
    );
    if (!sheetName) {
      return NextResponse.json(
        {
          error: `Sheet "ALL" not found. Available: ${workbook.SheetNames.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    // ─── Step 1: Clean up old member data ────────────────────────────────────
    // Delete employee_data for ALL member-role users
    await db.execute(sql`
      DELETE FROM employee_data
      WHERE user_id IN (SELECT id FROM users WHERE role = 'member')
    `);

    // Delete member users that have NO references in financial tables
    // (savings, loans, loan_balances, monthly_deductions, purchase_orders, approvals)
    // Members WITH financial data are kept and will be updated
    // Count members before delete
    const membersBefore = await db.select({ id: users.id }).from(users).where(eq(users.role, "member"));
    const beforeCount = membersBefore.length;

    await db.execute(sql`
      DELETE FROM users
      WHERE role = 'member'
        AND id NOT IN (SELECT DISTINCT user_id FROM savings WHERE user_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT user_id FROM loans WHERE user_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT user_id FROM loan_balances WHERE user_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT user_id FROM monthly_deductions WHERE user_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT user_id FROM purchase_orders WHERE user_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT approver_id FROM approvals WHERE approver_id IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT uploaded_by FROM upload_logs WHERE uploaded_by IS NOT NULL)
    `);

    const membersAfter = await db.select({ id: users.id }).from(users).where(eq(users.role, "member"));
    const deleted = beforeCount - membersAfter.length;

    // ─── Step 2: Process Excel rows ──────────────────────────────────────────
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const processedEmails = new Set<string>();

    // Start from row 1 (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const nup = row[0] ? String(row[0]).trim() : "";
      const name = row[1] ? String(row[1]).trim() : "";
      const perusahaan = row[2] ? String(row[2]).trim() : "";
      const departemen = row[3] ? String(row[3]).trim() : "";
      const unitPenempatan = row[4] ? String(row[4]).trim() : "";
      const jabatan = row[5] ? String(row[5]).trim() : "";
      const email = row[6] ? String(row[6]).trim().toLowerCase() : "";
      const status = row[7] ? String(row[7]).trim().toUpperCase() : "";

      // Skip empty rows or header-like rows
      if (!name || name.toLowerCase() === "nama" || name.toLowerCase() === "nama pegawai") continue;
      if (name.toLowerCase().includes("jumlah") || name.toLowerCase().includes("total")) continue;

      // Generate email if missing: use NUP or name-based
      let memberEmail = email;
      if (!memberEmail) {
        if (nup) {
          memberEmail = `${nup}@kopeg-bki.id`;
        } else {
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, ".")
            .substring(0, 50);
          memberEmail = `${slug}@kopeg-bki.id`;
        }
      }

      // Skip duplicates in the same file
      if (processedEmails.has(memberEmail)) {
        skipped++;
        if (errors.length < 20) errors.push(`Row ${i + 1}: "${name}" - duplicate email "${memberEmail}"`);
        continue;
      }
      processedEmails.add(memberEmail);

      const isActive = status === "AKTIF" || status === "";

      try {
        // Try to find existing user by email (only survivors with financial data)
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, memberEmail));

        if (existing) {
          // Update existing user (kept because they have financial data)
          await db
            .update(users)
            .set({
              fullName: name,
              employeeId: nup || existing.employeeId,
              department: departemen || existing.department,
              isActive,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id));

          // Create fresh employee_data (old ones were deleted in step 1)
          await db.insert(employeeData).values({
            userId: existing.id,
            fullName: name,
            employeeNumber: nup || null,
            email: memberEmail,
            department: departemen,
            position: jabatan,
            rawData: { perusahaan, unitPenempatan, status },
          });

          updated++;
        } else {
          // Create new user with placeholder authId (will be linked on first login)
          const placeholderAuthId = `pending_${randomUUID()}`;

          const [newUser] = await db
            .insert(users)
            .values({
              authId: placeholderAuthId,
              email: memberEmail,
              fullName: name,
              role: "member",
              employeeId: nup || null,
              department: departemen || null,
              isActive,
            })
            .returning();

          // Create employee_data record
          await db.insert(employeeData).values({
            userId: newUser.id,
            fullName: name,
            employeeNumber: nup || null,
            email: memberEmail,
            department: departemen,
            position: jabatan,
            rawData: { perusahaan, unitPenempatan, status },
          });

          created++;
        }
      } catch (err) {
        skipped++;
        if (errors.length < 20) {
          errors.push(
            `Row ${i + 1}: "${name}" (${memberEmail}) - ${err instanceof Error ? err.message : "unknown error"}`
          );
        }
      }
    }

    // Log the upload
    await db.insert(uploadLogs).values({
      uploadType: "member_database",
      period: new Date().toISOString().substring(0, 7),
      fileName: file.name,
      subType: "data_anggota",
      recordCount: created + updated,
      totalAmount: "0",
      uploadedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      deleted,
      created,
      updated,
      skipped,
      total: created + updated + skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Failed to upload member database:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "",
      },
      { status: 500 }
    );
  }
}
