import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";

/**
 * GET /api/users/me
 *
 * Returns the currently signed-in user's full profile (including the
 * onboarding flags so the frontend knows whether to show the first-time
 * profile setup wizard).
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);
    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("Failed to fetch own profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi").optional(),
  phone: z.string().min(1, "Nomor HP wajib diisi").optional(),
  nik: z
    .string()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka")
    .optional()
    .or(z.literal("")),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["laki-laki", "perempuan"]).optional().or(z.literal("")),
  maritalStatus: z
    .enum(["belum_menikah", "menikah", "cerai_hidup", "cerai_mati"])
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
  /** Set to true once the user finishes the first-time profile wizard. */
  markProfileCompleted: z.boolean().optional(),
  /** Set to true after a successful Supabase password change. */
  markPasswordChanged: z.boolean().optional(),
});

/**
 * PUT /api/users/me
 *
 * Updates the currently signed-in user's own profile (and optionally
 * flips the onboarding flags). Used both by the first-time setup wizard
 * and by the regular settings page so members can keep editing later.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.nik !== undefined) updateData.nik = data.nik || null;
    if (data.birthPlace !== undefined)
      updateData.birthPlace = data.birthPlace || null;
    if (data.birthDate !== undefined)
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.maritalStatus !== undefined)
      updateData.maritalStatus = data.maritalStatus || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.employeeId !== undefined)
      updateData.employeeId = data.employeeId || null;
    if (data.department !== undefined)
      updateData.department = data.department || null;
    if (data.position !== undefined)
      updateData.position = data.position || null;
    if (data.bankName !== undefined)
      updateData.bankName = data.bankName || null;
    if (data.bankAccount !== undefined)
      updateData.bankAccount = data.bankAccount || null;
    if (data.bankAccountName !== undefined)
      updateData.bankAccountName = data.bankAccountName || null;

    if (data.markProfileCompleted) updateData.profileCompleted = true;
    if (data.markPasswordChanged) updateData.passwordChanged = true;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, dbUser.id))
      .returning();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Failed to update own profile:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Gagal menyimpan profil: ${message}` },
      { status: 500 }
    );
  }
}
