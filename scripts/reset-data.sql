-- ============================================================================
-- reset-data.sql
-- Safely reset ALL application data while preserving schema, tables, enums,
-- functions, and triggers.
--
-- Two modes:
--   MODE A (default): Full reset - clears ALL data including users.
--                     You must re-run create-auth-users.ts + import-simpanan.sql after.
--   MODE B:           Transactional reset - keeps users & employee_data intact,
--                     only clears business data (loans, POs, savings, etc.)
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
SET session_replication_role = 'DEFAULT';

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

SET session_replication_role = 'DEFAULT';

COMMIT;

-- After running this, re-upload data via admin UI:
--   1. Upload simpanan saldo (savings)
--   2. Upload pinjaman saldo (loan balances)
--   3. Upload potongan bulanan (monthly deductions)
*/
