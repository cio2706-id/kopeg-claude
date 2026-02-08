import { db } from "@/lib/db";
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
export async function getOrCreateUser(authUser: AuthUser) {
  const email = authUser.email!;
  const fullName =
    authUser.user_metadata?.full_name || email.split("@")[0];

  // 1. Try by authId
  let [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.authId, authUser.id));

  if (dbUser) return dbUser;

  // 2. Try by email (user may exist from manual creation or role assignment)
  [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (dbUser) {
    // Link the Supabase auth ID to this existing DB user
    [dbUser] = await db
      .update(users)
      .set({ authId: authUser.id, updatedAt: new Date() })
      .where(eq(users.id, dbUser.id))
      .returning();
    return dbUser;
  }

  // 3. Create new user
  [dbUser] = await db
    .insert(users)
    .values({
      authId: authUser.id,
      email,
      fullName,
      role: "member",
    })
    .returning();

  return dbUser;
}
