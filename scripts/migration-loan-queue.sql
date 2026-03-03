-- Migration: Add loan queue system (nomor urut) and loan quotas
-- Run this in Supabase SQL Editor

-- 1. Add 'held' to loan_status enum
DO $$ BEGIN
  ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'held';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add 'hold' to approval_action enum
DO $$ BEGIN
  ALTER TYPE approval_action ADD VALUE IF NOT EXISTS 'hold';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add queue columns to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS queue_number INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS queue_period VARCHAR(7); -- "YYYY-MM"
ALTER TABLE loans ADD COLUMN IF NOT EXISTS hold_reason TEXT;

-- 4. Create loan_quotas table
CREATE TABLE IF NOT EXISTS loan_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(7) NOT NULL, -- "YYYY-MM"
  loan_type loan_type NOT NULL,
  quota INTEGER NOT NULL DEFAULT 10,
  used_quota INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_loans_queue_period ON loans(queue_period);
CREATE INDEX IF NOT EXISTS idx_loans_queue_number ON loans(queue_period, queue_number);
CREATE INDEX IF NOT EXISTS idx_loan_quotas_period ON loan_quotas(period);
CREATE INDEX IF NOT EXISTS idx_loan_quotas_period_type ON loan_quotas(period, loan_type);

-- 6. Backfill: Assign queue numbers to existing pending loans
-- This assigns queue numbers based on creation date for loans that don't have one yet
DO $$
DECLARE
  r RECORD;
  current_period VARCHAR(7);
  next_num INTEGER;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM loans
    WHERE queue_number IS NULL
      AND status NOT IN ('draft', 'rejected', 'selesai')
    ORDER BY created_at ASC
  LOOP
    current_period := TO_CHAR(r.created_at, 'YYYY-MM');

    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_num
    FROM loans
    WHERE queue_period = current_period;

    UPDATE loans
    SET queue_number = next_num, queue_period = current_period
    WHERE id = r.id;
  END LOOP;
END $$;
