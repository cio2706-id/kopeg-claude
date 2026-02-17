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
 * Strategy: Full reset of member data.
 * - Pengurus (non-member roles) are NOT affected.
 * - Case-insensitive email matching to avoid duplicates (ALDICIO vs aldicio).
 * - Duplicate member users are merged (financial data transferred to survivor).
 * - Old members not in the new Excel are fully deleted (including financial data).
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

    // ─── Step 1: Delete all employee_data for members ──────────────────────────
    await db.execute(sql`
      DELETE FROM employee_data
      WHERE user_id IN (SELECT id FROM users WHERE role = 'member')
    `);

    // ─── Step 2: Merge case-insensitive duplicate members ──────────────────────
    // Find groups of members with the same email (case-insensitive)
    const dupGroups = await db.execute(sql`
      SELECT LOWER(email) as lower_email,
             array_agg(id ORDER BY created_at ASC) as user_ids
      FROM users
      WHERE role = 'member'
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    `);

    let merged = 0;
    for (const group of dupGroups as unknown as { lower_email: string; user_ids: string[] }[]) {
      const ids = group.user_ids;
      const keepId = ids[0]; // keep oldest
      const removeIds = ids.slice(1);

      for (const removeId of removeIds) {
        // Transfer all financial data references to the survivor
        await db.execute(sql`UPDATE savings SET user_id = ${keepId} WHERE user_id = ${removeId}`);
        await db.execute(sql`UPDATE loans SET user_id = ${keepId} WHERE user_id = ${removeId}`);
        await db.execute(sql`UPDATE loan_balances SET user_id = ${keepId} WHERE user_id = ${removeId}`);
        await db.execute(sql`UPDATE monthly_deductions SET user_id = ${keepId} WHERE user_id = ${removeId}`);
        await db.execute(sql`UPDATE purchase_orders SET user_id = ${keepId} WHERE user_id = ${removeId}`);
        // Delete the duplicate user
        await db.execute(sql`DELETE FROM users WHERE id = ${removeId}`);
        merged++;
      }
    }

    // Count members before processing
    const membersBefore = await db.select({ id: users.id }).from(users).where(eq(users.role, "member"));
    const beforeCount = membersBefore.length;

    // ─── Step 3: Process Excel rows ────────────────────────────────────────────
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const processedEmails = new Set<string>();
    const matchedUserIds = new Set<string>();

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
      if (processedEmails.has(memberEmail.toLowerCase())) {
        skipped++;
        if (errors.length < 20) errors.push(`Row ${i + 1}: "${name}" - duplicate email "${memberEmail}"`);
        continue;
      }
      processedEmails.add(memberEmail.toLowerCase());

      const isActive = status === "AKTIF" || status === "";

      try {
        // Case-insensitive email lookup
        const existingRows = await db.execute(
          sql`SELECT id, employee_id, department FROM users WHERE LOWER(email) = ${memberEmail.toLowerCase()} AND role = 'member' LIMIT 1`
        ) as unknown as { id: string; employee_id: string; department: string }[];
        const existing = existingRows[0];

        if (existing) {
          // Update existing user
          matchedUserIds.add(existing.id);
          await db
            .update(users)
            .set({
              fullName: name,
              email: memberEmail, // normalize email casing
              employeeId: nup || existing.employee_id,
              department: departemen || existing.department,
              isActive,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id));

          // Create fresh employee_data
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
          // Create new user with placeholder authId
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

          matchedUserIds.add(newUser.id);

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

    // ─── Step 4: Delete old members NOT in the new Excel ───────────────────────
    // This includes deleting their financial data (full reset)
    const remainingMembers = await db.select({ id: users.id }).from(users).where(eq(users.role, "member"));
    const unmatchedIds = remainingMembers
      .filter((m) => !matchedUserIds.has(m.id))
      .map((m) => m.id);

    let forceDeleted = 0;
    for (const uid of unmatchedIds) {
      // Delete all related financial data
      await db.execute(sql`DELETE FROM savings WHERE user_id = ${uid}`);
      await db.execute(sql`DELETE FROM loans WHERE user_id = ${uid}`);
      await db.execute(sql`DELETE FROM loan_balances WHERE user_id = ${uid}`);
      await db.execute(sql`DELETE FROM monthly_deductions WHERE user_id = ${uid}`);
      await db.execute(sql`UPDATE purchase_orders SET user_id = NULL WHERE user_id = ${uid}`);
      await db.execute(sql`UPDATE approvals SET approver_id = NULL WHERE approver_id = ${uid}`);
      await db.execute(sql`UPDATE upload_logs SET uploaded_by = NULL WHERE uploaded_by = ${uid}`);
      await db.execute(sql`DELETE FROM employee_data WHERE user_id = ${uid}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${uid}`);
      forceDeleted++;
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
      deleted: forceDeleted,
      merged,
      created,
      updated,
      skipped,
      total: created + updated + skipped,
      beforeCount,
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
