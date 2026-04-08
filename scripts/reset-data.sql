-- ============================================================================
-- reset-data.sql
-- Safely reset ALL application data while preserving schema, tables, enums,
-- functions, and triggers.
--
-- Three modes:
--   MODE A (default): Full reset - clears ALL data including users.
--                     You must re-run create-auth-users.ts + import-simpanan.sql after.
--   MODE B:           Transactional reset - keeps users & employee_data intact,
--                     only clears business data (loans, POs, savings, etc.)
--   MODE C:           Keep pengurus - clears business data AND member accounts,
--                     but keeps all pengurus accounts (staf_*, manager,
--                     bendahara, sekertaris, ketua) and their auth.users rows.
--
-- Usage: Run in Supabase SQL Editor or via psql
-- ============================================================================

-- ============================================================================
-- MODE A: FULL RESET (uncomment this section, comment out Mode B)
-- Clears everything. Start completely fresh.
-- ============================================================================

BEGIN;

-- Disable triggers temporarily to avoid issues during truncation
SET session_replication_role = 'replica';

-- Truncate all tables in dependency order (children first, then parents)
-- Using CASCADE handles any remaining FK dependencies automatically

-- 1. Child tables (no other table references these)
TRUNCATE TABLE spp_items CASCADE;
TRUNCATE TABLE po_items CASCADE;
TRUNCATE TABLE loan_installments CASCADE;
TRUNCATE TABLE approvals CASCADE;

-- 2. Tables referencing spp
TRUNCATE TABLE spp CASCADE;

-- 3. Business data tables referencing users
TRUNCATE TABLE loans CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE payment_requests CASCADE;
TRUNCATE TABLE savings CASCADE;
TRUNCATE TABLE loan_balances CASCADE;
TRUNCATE TABLE monthly_deductions CASCADE;
TRUNCATE TABLE upload_logs CASCADE;

-- 4. Standalone / reference tables
TRUNCATE TABLE loan_quotas CASCADE;
TRUNCATE TABLE promotions CASCADE;
TRUNCATE TABLE calendar_events CASCADE;

-- 5. User-related tables
TRUNCATE TABLE employee_data CASCADE;
TRUNCATE TABLE users CASCADE;

-- 6. Clear Supabase Auth users (this removes all login accounts!)
-- WARNING: This deletes ALL auth accounts. Users will need to be recreated.
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- After running this, re-seed data with:
--   1. npx tsx scripts/create-auth-users.ts   (recreate Supabase Auth accounts)
--   2. Run scripts/import-simpanan.sql         (import users + savings data)
--   3. Optionally upload loan balances & deductions via the admin UI


-- ============================================================================
-- MODE B: TRANSACTIONAL RESET ONLY (keeps users intact)
-- Uncomment this section and comment out Mode A above if you only want to
-- clear business data while keeping all user accounts.
-- ============================================================================

/*
BEGIN;

SET session_replication_role = 'replica';

-- 1. Child tables
TRUNCATE TABLE spp_items CASCADE;
TRUNCATE TABLE po_items CASCADE;
TRUNCATE TABLE loan_installments CASCADE;
TRUNCATE TABLE approvals CASCADE;

-- 2. SPP
TRUNCATE TABLE spp CASCADE;

-- 3. Business data (but NOT users or employee_data)
TRUNCATE TABLE loans CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE payment_requests CASCADE;
TRUNCATE TABLE savings CASCADE;
TRUNCATE TABLE loan_balances CASCADE;
TRUNCATE TABLE monthly_deductions CASCADE;
TRUNCATE TABLE upload_logs CASCADE;

-- 4. Standalone tables
TRUNCATE TABLE loan_quotas CASCADE;
TRUNCATE TABLE promotions CASCADE;
TRUNCATE TABLE calendar_events CASCADE;

SET session_replication_role = 'origin';

COMMIT;

-- After running this, re-upload data via admin UI:
--   1. Upload simpanan saldo (savings)
--   2. Upload pinjaman saldo (loan balances)
--   3. Upload potongan bulanan (monthly deductions)
*/


-- ============================================================================
-- MODE C: KEEP PENGURUS ONLY
-- Clears business data AND member accounts, but preserves every pengurus
-- account (any role other than 'member') and their corresponding auth.users
-- rows. Use this when you want a fresh dataset without re-creating the
-- admin/staff/board accounts.
-- ============================================================================

/*
BEGIN;

SET session_replication_role = 'replica';

-- 1. Child tables
TRUNCATE TABLE spp_items CASCADE;
TRUNCATE TABLE po_items CASCADE;
TRUNCATE TABLE loan_installments CASCADE;
TRUNCATE TABLE approvals CASCADE;

-- 2. SPP
TRUNCATE TABLE spp CASCADE;

-- 3. Business data
TRUNCATE TABLE loans CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE payment_requests CASCADE;
TRUNCATE TABLE savings CASCADE;
TRUNCATE TABLE loan_balances CASCADE;
TRUNCATE TABLE monthly_deductions CASCADE;
TRUNCATE TABLE upload_logs CASCADE;

-- 4. Standalone tables
TRUNCATE TABLE loan_quotas CASCADE;
TRUNCATE TABLE promotions CASCADE;
TRUNCATE TABLE calendar_events CASCADE;

-- 5. Delete Supabase Auth accounts that belong to member users.
--    Done first so we can still resolve auth_id via the users table.
--    Skips placeholder auth_ids (rows that have not yet logged in).
DELETE FROM auth.users
WHERE id::text IN (
  SELECT auth_id FROM users
  WHERE role = 'member' AND auth_id NOT LIKE 'pending_%'
);

-- 6. Delete employee_data rows belonging to member users (FK to users)
DELETE FROM employee_data
WHERE user_id IN (SELECT id FROM users WHERE role = 'member');

-- 7. Delete the member users themselves; pengurus rows stay intact.
DELETE FROM users WHERE role = 'member';

SET session_replication_role = 'origin';

COMMIT;

-- After running this, pengurus accounts are preserved. Re-seed members with:
--   1. npx tsx scripts/create-auth-users.ts   (skips already-existing pengurus)
--   2. Run scripts/import-simpanan.sql        (re-imports member savings data)
--   3. Optionally upload loan balances & deductions via the admin UI
*/
