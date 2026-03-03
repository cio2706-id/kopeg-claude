-- Migration: Change loan_quotas from count-based to amount-based (Rupiah)
-- Run this in Supabase SQL Editor
--
-- Changes:
-- 1. Rename quota → quota_amount (NUMERIC, Rupiah amount)
-- 2. Rename used_quota → used_amount (NUMERIC, Rupiah amount)
-- 3. Default quotas: Reguler = Rp 50.000.000, Khusus = Rp 70.000.000

-- 1. Add new numeric columns
ALTER TABLE loan_quotas ADD COLUMN IF NOT EXISTS quota_amount NUMERIC(15,2) NOT NULL DEFAULT 50000000;
ALTER TABLE loan_quotas ADD COLUMN IF NOT EXISTS used_amount NUMERIC(15,2) NOT NULL DEFAULT 0;

-- 2. Drop old integer columns (they had count-based data, no longer relevant)
ALTER TABLE loan_quotas DROP COLUMN IF EXISTS quota;
ALTER TABLE loan_quotas DROP COLUMN IF EXISTS used_quota;

-- 3. Recalculate used_amount from actual approved loans for each period + type
-- This sums the loan amounts of all approved/disbursed loans per period and type
DO $$
DECLARE
  r RECORD;
  total_used NUMERIC(15,2);
BEGIN
  FOR r IN
    SELECT id, period, loan_type FROM loan_quotas
  LOOP
    SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO total_used
    FROM loans
    WHERE queue_period = r.period
      AND loan_type = r.loan_type::TEXT::loan_type
      AND status IN ('approved', 'spp_process', 'bank_process', 'disbursed', 'selesai');

    UPDATE loan_quotas
    SET used_amount = total_used
    WHERE id = r.id;
  END LOOP;
END $$;
