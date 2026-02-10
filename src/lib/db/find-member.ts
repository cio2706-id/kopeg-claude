import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";

/**
 * Match a member by employee ID (NUP/NO.ANGGOTA) or by name.
 * Returns the user ID if found, null otherwise.
 */
export async function findMemberByIdOrName(
  employeeId?: string | number | null,
  name?: string | null
): Promise<string | null> {
  // Try employee ID first (most reliable)
  if (employeeId) {
    const id = String(employeeId).trim();
    if (id) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.employeeId, id));
      if (user) return user.id;
    }
  }

  // Fall back to name matching (case-insensitive)
  if (name) {
    const cleanName = String(name).trim();
    if (cleanName && cleanName.length > 2) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(ilike(users.fullName, cleanName));
      if (user) return user.id;
    }
  }

  return null;
}
