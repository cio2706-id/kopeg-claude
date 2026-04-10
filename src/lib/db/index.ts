import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Connection options tuned for Supabase Postgres (pooler-friendly).
// - `prepare: false` is required for the Transaction-mode pooler (pgBouncer).
// - `idle_timeout` closes idle sockets before the pooler/NAT kills them
//   (which was surfacing as ECONNRESET on the next query).
// - `max_lifetime` rotates connections periodically to avoid stale sockets.
// - `connect_timeout` fails fast instead of hanging on a bad connection.
// - `max` keeps us well under the pooler's per-client limit.
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

/**
 * Run a DB operation with retries on transient connection errors.
 *
 * Supabase's pooler occasionally closes sockets that the driver still holds,
 * which surfaces as ECONNRESET / ETIMEDOUT / ECONNREFUSED on the next query.
 * The driver will open a fresh socket on the retry, so one or two attempts
 * are usually enough to recover transparently.
 */
const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  if (e.code && TRANSIENT_ERROR_CODES.has(e.code)) return true;
  if (e.cause?.code && TRANSIENT_ERROR_CODES.has(e.cause.code)) return true;
  return false;
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, delayMs = 150 }: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isTransientDbError(err)) {
        throw err;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * (attempt + 1))
      );
    }
  }
  throw lastError;
}
