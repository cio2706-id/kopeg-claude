import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeData, uploadLogs } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, and, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";

/**
 * Upload member database from "DATA ANGGOTA KOPERASI UPDATE.xlsx"
 * Sheet "ALL" columns:
 *   A(0): NUP, B(1): Nama, C(2): Perusahaan, D(3): Departemen,
 *   E(4): Unit Penempatan, F(5): Jabatan, G(6): EMAIL,
 *   H(7): STATUS (AKTIF/PASIF), I(8): Simpanan, J(9): Pinjaman
 *
 * Strategy: Replace existing member data with new Excel data.
 * - Pengurus (non-member roles) are NOT affected.
 * - Existing members NOT in the new file are marked inactive.
 * - Members in the file are upserted by email.
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

    // Step 1: Mark ALL existing members as inactive (they'll be reactivated if in the file)
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.role, "member"));

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
          // Use name-based email
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
        // Try to find existing user by email
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, memberEmail));

        if (existing) {
          // Update existing user
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

          // Upsert employee_data
          const [existingEmpData] = await db
            .select()
            .from(employeeData)
            .where(eq(employeeData.userId, existing.id));

          if (existingEmpData) {
            await db
              .update(employeeData)
              .set({
                fullName: name,
                employeeNumber: nup || existingEmpData.employeeNumber,
                email: memberEmail,
                department: departemen,
                position: jabatan,
                rawData: { perusahaan, unitPenempatan, status },
                updatedAt: new Date(),
              })
              .where(eq(employeeData.id, existingEmpData.id));
          } else {
            await db.insert(employeeData).values({
              userId: existing.id,
              fullName: name,
              employeeNumber: nup || null,
              email: memberEmail,
              department: departemen,
              position: jabatan,
              rawData: { perusahaan, unitPenempatan, status },
            });
          }

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
