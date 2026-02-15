-- Migration: Loan form data + channeling type
--
-- IMPORTANT: PostgreSQL requires ALTER TYPE ... ADD VALUE to be committed
-- before the new value can be used. Run each step SEPARATELY in Supabase SQL editor.
--
-- ============================================================
-- STEP 1: Run this FIRST, then click "Run"
-- ============================================================
ALTER TYPE loan_type ADD VALUE IF NOT EXISTS 'channeling';

-- ============================================================
-- STEP 2: Run this SECOND (after Step 1 succeeds)
-- ============================================================
-- ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'on_review';
-- ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'selesai';

-- ============================================================
-- STEP 3: Run this THIRD (after Step 2 succeeds)
-- ============================================================
-- ALTER TABLE loans ADD COLUMN IF NOT EXISTS form_data jsonb;

-- ============================================================
-- STEP 4 (optional): Verify all changes
-- ============================================================
-- SELECT unnest(enum_range(NULL::loan_type)) AS loan_types;
-- SELECT unnest(enum_range(NULL::loan_status)) AS loan_statuses;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'form_data';
