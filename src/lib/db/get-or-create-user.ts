import { db, withDbRetry } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User as AuthUser } from "@supabase/supabase-js";

/**
 * Get or create a DB user from a Supabase auth user.
 *
 * Lookup order:
 *  1. By authId (Supabase UID)
 *  2. By email (handles case where DB user was created before first login)
 *  3. Insert new user if neither found
 *
 * If found by email but authId doesn't match, links them by updating authId.
 */
const VALID_ROLES = [
  "member",
  "staf_pengadaan",
  "staf_treasury",
  "staf_sekper",
  "staf_piutang",
  "staf_akunting",
  "manager",
  "bendahara",
  "sekertaris",
  "ketua",
] as const;

type UserRole = (typeof VALID_ROLES)[number];

function getAuthMetadataRole(authUser: AuthUser): UserRole {
  const metaRole = authUser.user_metadata?.role;
  if (metaRole && (VALID_ROLES as readonly string[]).includes(metaRole)) {
    return metaRole as UserRole;
  }
  return "member";
}

export async function getOrCreateUser(authUser: AuthUser) {
  const email = authUser.email!;
  const fullName =
    authUser.user_metadata?.full_name || email.split("@")[0];
  const authRole = getAuthMetadataRole(authUser);

  // 1. Try by authId
  // Wrapped in withDbRetry because this is the first query on most requests,
  // so it's the one most likely to hit a stale pooler socket (ECONNRESET).
  let [dbUser] = await withDbRetry(() =>
    db.select().from(users).where(eq(users.authId, authUser.id))
  );

  if (dbUser) {
    // Sync role from auth metadata if DB role is still default "member"
    // but auth metadata has a specific role assigned
    if (dbUser.role === "member" && authRole !== "member") {
      [dbUser] = await db
        .update(users)
        .set({ role: authRole, updatedAt: new Date() })
        .where(eq(users.id, dbUser.id))
        .returning();
    }
    return dbUser;
  }

  // 2. Try by email (user may exist from manual creation or role assignment)
  [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (dbUser) {
    // Link the Supabase auth ID to this existing DB user
    // Also sync role from auth metadata if DB role is still "member"
    const updateData: Record<string, unknown> = { authId: authUser.id, updatedAt: new Date() };
    if (dbUser.role === "member" && authRole !== "member") {
      updateData.role = authRole;
    }
    [dbUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, dbUser.id))
      .returning();
    return dbUser;
  }

  // 3. Create new user — use role from auth metadata if available
  [dbUser] = await db
    .insert(users)
    .values({
      authId: authUser.id,
      email,
      fullName,
      role: authRole,
    })
    .returning();

  return dbUser;
}
