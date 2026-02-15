import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { spp, sppItems, loans, purchaseOrders, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, desc, sql, isNull, or } from "drizzle-orm";
import { z } from "zod";

// ─── GET: List all SPP ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const allSpp = await db
      .select({
        id: spp.id,
        sppNumber: spp.sppNumber,
        referenceType: spp.referenceType,
        referenceId: spp.referenceId,
        requestDate: spp.requestDate,
        payableTo: spp.payableTo,
        totalAmount: spp.totalAmount,
        status: spp.status,
        createdBy: spp.createdBy,
        createdAt: spp.createdAt,
        creatorName: users.fullName,
      })
      .from(spp)
      .leftJoin(users, eq(spp.createdBy, users.id))
      .orderBy(desc(spp.createdAt));

    // Filter by status if provided
    const filtered = status
      ? allSpp.filter((s) => s.status === status)
      : allSpp;

    return NextResponse.json({ spp: filtered });
  } catch (error) {
    console.error("Failed to fetch SPP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create new SPP ────────────────────────────────────────────────────

const createSppSchema = z.object({
  referenceType: z.enum(["loan", "purchase_order"]).nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
  unitKerja: z.string().default("KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA"),
  requestDate: z.string(),
  payableTo: z.string().min(1, "Dibayarkan kepada wajib diisi"),
  totalAmount: z.number().positive("Jumlah harus lebih dari 0"),
  amountInWords: z.string().optional(),
  supportingDocs: z.string().default("Terlampir"),
  hasPph23: z.boolean().default(false),
  pphDetails: z.array(z.object({ description: z.string(), amount: z.number() })).optional(),
  totalInvoice: z.number().optional(),
  pphDue: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      accountCode: z.string().min(1, "No. Akun wajib diisi"),
      description: z.string().min(1, "Keterangan wajib diisi"),
      amount: z.number().positive("Jumlah harus lebih dari 0"),
    })
  ).min(1, "Minimal 1 item pembayaran"),
});

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

    const body = await request.json();
    const parsed = createSppSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.issues }, { status: 400 });
    }

    const { items, ...sppData } = parsed.data;

    // Generate SPP number: NNN/KOPEG/SPP/MM/YYYY
    const now = new Date();
    const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][now.getMonth()];
    const year = now.getFullYear();

    // Count existing SPP this year
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(spp);
    const seqNum = Number(countResult[0]?.count || 0) + 1;
    const sppNumber = `${String(seqNum).padStart(3, "0")}/KOPEG/SPP/${monthRoman}/${year}`;

    // Create SPP record
    const [newSpp] = await db
      .insert(spp)
      .values({
        sppNumber,
        referenceType: sppData.referenceType || null,
        referenceId: sppData.referenceId || null,
        unitKerja: sppData.unitKerja,
        requestDate: new Date(sppData.requestDate),
        payableTo: sppData.payableTo,
        totalAmount: String(sppData.totalAmount),
        amountInWords: sppData.amountInWords || null,
        supportingDocs: sppData.supportingDocs,
        hasPph23: sppData.hasPph23,
        pphDetails: sppData.pphDetails || null,
        totalInvoice: sppData.totalInvoice ? String(sppData.totalInvoice) : null,
        pphDue: sppData.pphDue ? String(sppData.pphDue) : null,
        status: "draft",
        createdBy: dbUser.id,
        notes: sppData.notes || null,
      })
      .returning();

    // Create line items
    for (let i = 0; i < items.length; i++) {
      await db.insert(sppItems).values({
        sppId: newSpp.id,
        accountCode: items[i].accountCode,
        description: items[i].description,
        amount: String(items[i].amount),
        sortOrder: i + 1,
      });
    }

    // Link to loan or PO if referenced
    if (sppData.referenceType === "loan" && sppData.referenceId) {
      await db
        .update(loans)
        .set({ sppId: newSpp.id, updatedAt: new Date() })
        .where(eq(loans.id, sppData.referenceId));
    } else if (sppData.referenceType === "purchase_order" && sppData.referenceId) {
      await db
        .update(purchaseOrders)
        .set({ sppId: newSpp.id, sppRef: sppNumber, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, sppData.referenceId));
    }

    return NextResponse.json({ spp: newSpp }, { status: 201 });
  } catch (error) {
    console.error("Failed to create SPP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
