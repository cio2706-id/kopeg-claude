import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeData } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createUserSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["member", "staf_pengadaan", "staf_treasury", "staf_piutang", "staf_akunting", "manager", "bendahara", "sekertaris", "ketua"]).default("member"),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.issues }, { status: 400 });
    }

    const { fullName, email, role, phone, employeeId, department, position, company } = parsed.data;

    // Check if email already exists
    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // Create user with placeholder authId (will be linked on first login via getOrCreateUser)
    const placeholderAuthId = `pending_${randomUUID()}`;

    const [newUser] = await db
      .insert(users)
      .values({
        authId: placeholderAuthId,
        email: email.toLowerCase(),
        fullName,
        role,
        phone: phone || null,
        employeeId: employeeId || null,
        department: department || null,
      })
      .returning();

    // Create employee_data record if extra details provided
    if (position || company || employeeId) {
      await db.insert(employeeData).values({
        userId: newUser.id,
        fullName,
        employeeNumber: employeeId || null,
        email: email.toLowerCase(),
        department: department || null,
        position: position || null,
        rawData: company ? { perusahaan: company } : null,
      });
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).optional(),
  role: z.enum(["member", "staf_pengadaan", "staf_treasury", "staf_piutang", "staf_akunting", "manager", "bendahara", "sekertaris", "ketua"]).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const { id, ...updateData } = parsed.data;
    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const [deleted] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: deleted });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
