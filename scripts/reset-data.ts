/**
 * reset-data.ts
 *
 * Safely reset all application data while preserving database schema.
 *
 * Usage:
 *   npx tsx scripts/reset-data.ts                  # Full reset (clears users too)
 *   npx tsx scripts/reset-data.ts --keep-users     # Keep ALL users, clear business data only
 *   npx tsx scripts/reset-data.ts --keep-pengurus  # Keep only pengurus accounts (non-member roles)
 *   npx tsx scripts/reset-data.ts --dry-run        # Show what would be deleted without executing
 *
 * After full reset, re-seed with:
 *   1. npx tsx scripts/create-auth-users.ts
 *   2. Run scripts/import-simpanan.sql in Supabase SQL Editor
 */

import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  console.error("Make sure your .env file exists with DATABASE_URL=postgresql://...");
  process.exit(1);
}

const args = process.argv.slice(2);
const keepUsers = args.includes("--keep-users");
const keepPengurus = args.includes("--keep-pengurus");
const dryRun = args.includes("--dry-run");

if (keepUsers && keepPengurus) {
  console.error("ERROR: Cannot use --keep-users and --keep-pengurus together.");
  console.error("  --keep-users     keeps ALL accounts");
  console.error("  --keep-pengurus  keeps only pengurus (non-member) accounts");
  process.exit(1);
}

// Pengurus = any user whose role is NOT 'member'
// (staf_pengadaan, staf_treasury, staf_sekper, staf_piutang, staf_akunting,
//  manager, bendahara, sekertaris, ketua)

// Tables in truncation order (children first, then parents)
const BUSINESS_TABLES = [
  "spp_items",
  "po_items",
  "loan_installments",
  "approvals",
  "spp",
  "loans",
  "purchase_orders",
  "payment_requests",
  "savings",
  "loan_balances",
  "monthly_deductions",
  "upload_logs",
  "loan_quotas",
  "promotions",
  "calendar_events",
];

const USER_TABLES = [
  "employee_data",
  "users",
];

async function getRowCounts(sql: postgres.Sql): Promise<Record<string, number>> {
  const allTables = [...BUSINESS_TABLES, ...USER_TABLES];
  const counts: Record<string, number> = {};

  for (const table of allTables) {
    try {
      const result = await sql.unsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      counts[table] = Number(result[0].count);
    } catch {
      counts[table] = -1; // table doesn't exist
    }
  }

  // Count auth users separately
  try {
    const result = await sql.unsafe(`SELECT COUNT(*) as count FROM auth.users`);
    counts["auth.users"] = Number(result[0].count);
  } catch {
    counts["auth.users"] = -1;
  }

  // Count members vs pengurus separately for visibility
  try {
    const memberResult = await sql.unsafe(
      `SELECT COUNT(*) as count FROM "users" WHERE role = 'member'`
    );
    counts["users.member"] = Number(memberResult[0].count);

    const pengurusResult = await sql.unsafe(
      `SELECT COUNT(*) as count FROM "users" WHERE role <> 'member'`
    );
    counts["users.pengurus"] = Number(pengurusResult[0].count);
  } catch {
    counts["users.member"] = -1;
    counts["users.pengurus"] = -1;
  }

  return counts;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           KOPEG BKI - DATA RESET TOOL                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  const mode = keepUsers
    ? "TRANSACTIONAL (keep ALL users)"
    : keepPengurus
      ? "KEEP PENGURUS (clear members + business data)"
      : "FULL (clear everything)";
  console.log(`  Mode:     ${mode}`);
  console.log(`  Dry Run:  ${dryRun ? "YES (no changes will be made)" : "NO"}`);
  console.log();

  const sql = postgres(DATABASE_URL!, { prepare: false });

  try {
    // Show current data counts
    console.log("─── Current Data ────────────────────────────────────────────");
    const counts = await getRowCounts(sql);
    let totalRows = 0;

    for (const [table, count] of Object.entries(counts)) {
      if (count > 0) {
        console.log(`  ${table.padEnd(25)} ${count.toLocaleString()} rows`);
        totalRows += count;
      }
    }

    if (totalRows === 0) {
      console.log("\n  Database is already empty. Nothing to reset.");
      await sql.end();
      return;
    }

    console.log(`  ${"─".repeat(40)}`);
    console.log(`  ${"TOTAL".padEnd(25)} ${totalRows.toLocaleString()} rows`);
    console.log();

    if (dryRun) {
      console.log("─── Dry Run ─────────────────────────────────────────────────");
      console.log("  The following operations would be performed:");
      for (const table of BUSINESS_TABLES) {
        if (counts[table] > 0) {
          console.log(`    TRUNCATE ${table} CASCADE  (${counts[table]} rows)`);
        }
      }
      if (keepPengurus) {
        const memberCount = counts["users.member"] ?? 0;
        const pengurusCount = counts["users.pengurus"] ?? 0;
        console.log(`    DELETE employee_data WHERE user_id IN (member ids)`);
        console.log(`    DELETE FROM users WHERE role = 'member'   (${memberCount} rows)`);
        console.log(`    DELETE FROM auth.users WHERE id IN (member auth ids)`);
        console.log(`    KEEP   ${pengurusCount} pengurus account(s) intact`);
      } else if (!keepUsers) {
        for (const table of USER_TABLES) {
          if (counts[table] > 0) {
            console.log(`    TRUNCATE ${table} CASCADE  (${counts[table]} rows)`);
          }
        }
        if (counts["auth.users"] > 0) {
          console.log(`    DELETE FROM auth.users      (${counts["auth.users"]} rows)`);
        }
      }
      console.log("\n  No changes were made (dry run).");
      await sql.end();
      return;
    }

    // Safety confirmation via stdin
    console.log("─── WARNING ─────────────────────────────────────────────────");
    if (keepPengurus) {
      const memberCount = counts["users.member"] ?? 0;
      const pengurusCount = counts["users.pengurus"] ?? 0;
      console.log("  This will DELETE all business data AND all member accounts");
      console.log(`  (${memberCount} member(s) will be removed) but KEEP all`);
      console.log(`  ${pengurusCount} pengurus account(s) (staf, manager, bendahara,`);
      console.log("  sekertaris, ketua) intact along with their auth records.");
    } else if (!keepUsers) {
      console.log("  This will DELETE ALL DATA including user accounts!");
      console.log("  You will need to re-run create-auth-users.ts and");
      console.log("  import-simpanan.sql to restore base data.");
    } else {
      console.log("  This will DELETE all business data (loans, POs, savings,");
      console.log("  payments, deductions, etc.) but KEEP user accounts.");
    }
    console.log();
    console.log('  Type "RESET" to confirm, or anything else to cancel:');

    const confirmation = await new Promise<string>((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim());
        process.stdin.pause();
      });
    });

    if (confirmation !== "RESET") {
      console.log("\n  Cancelled. No changes were made.");
      await sql.end();
      return;
    }

    // Execute reset
    console.log("\n─── Resetting Data ──────────────────────────────────────────");

    await sql.unsafe(`SET session_replication_role = 'replica'`);

    // Truncate business tables
    for (const table of BUSINESS_TABLES) {
      if (counts[table] >= 0) { // table exists
        await sql.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Truncated ${table} (${counts[table]} rows removed)`);
      }
    }

    if (keepPengurus) {
      // Delete the Supabase Auth records that correspond to member users.
      // Done first (via subquery) so we can still join through the users table.
      // Skips placeholder auth_ids of the form 'pending_*' (cannot exist in auth.users).
      const deletedAuth = await sql.unsafe(
        `DELETE FROM auth.users
         WHERE id::text IN (
           SELECT auth_id FROM "users"
           WHERE role = 'member' AND auth_id NOT LIKE 'pending_%'
         )
         RETURNING id`
      );
      console.log(
        `  ✓ Deleted auth.users for members (${deletedAuth.length} rows removed)`
      );

      // Delete employee_data rows belonging to member users (FK to users)
      const deletedEmployee = await sql.unsafe(
        `DELETE FROM "employee_data"
         WHERE user_id IN (SELECT id FROM "users" WHERE role = 'member')
         RETURNING id`
      );
      console.log(
        `  ✓ Deleted employee_data for members (${deletedEmployee.length} rows removed)`
      );

      // Delete member users (keep all pengurus rows)
      const deletedUsers = await sql.unsafe(
        `DELETE FROM "users" WHERE role = 'member' RETURNING id`
      );
      console.log(
        `  ✓ Deleted member users (${deletedUsers.length} rows removed, ${counts["users.pengurus"] ?? 0} pengurus kept)`
      );
    } else if (!keepUsers) {
      // Truncate user tables if full reset
      for (const table of USER_TABLES) {
        if (counts[table] >= 0) {
          await sql.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
          console.log(`  ✓ Truncated ${table} (${counts[table]} rows removed)`);
        }
      }

      // Delete Supabase Auth users
      if (counts["auth.users"] > 0) {
        await sql.unsafe(`DELETE FROM auth.users`);
        console.log(`  ✓ Deleted auth.users (${counts["auth.users"]} rows removed)`);
      }
    }

    await sql.unsafe(`SET session_replication_role = 'DEFAULT'`);

    console.log("\n─── Done ────────────────────────────────────────────────────");
    console.log("  All data has been reset successfully!");
    console.log();

    if (keepPengurus) {
      console.log("  Pengurus accounts preserved. Next steps to re-seed members:");
      console.log("    1. npx tsx scripts/create-auth-users.ts");
      console.log("       (already-existing pengurus accounts will be skipped)");
      console.log("    2. Run scripts/import-simpanan.sql in Supabase SQL Editor");
      console.log("    3. Upload loan balances & deductions via admin UI");
    } else if (!keepUsers) {
      console.log("  Next steps to re-seed data:");
      console.log("    1. npx tsx scripts/create-auth-users.ts");
      console.log("    2. Run scripts/import-simpanan.sql in Supabase SQL Editor");
      console.log("    3. Upload loan balances & deductions via admin UI");
    } else {
      console.log("  Next steps to re-upload data:");
      console.log("    1. Upload simpanan saldo via admin UI");
      console.log("    2. Upload pinjaman saldo via admin UI");
      console.log("    3. Upload potongan bulanan via admin UI");
    }

    await sql.end();
  } catch (error) {
    console.error("\nERROR:", error);
    await sql.end();
    process.exit(1);
  }
}

main();
