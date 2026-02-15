-- Migration: Loan form data + channeling type
-- Run this in Supabase SQL editor

-- 1. Add 'channeling' to loan_type enum (keep 'travel' for backward compatibility)
ALTER TYPE loan_type ADD VALUE IF NOT EXISTS 'channeling';

-- 2. Add 'on_review' and 'selesai' to loan_status enum (for channeling simple flow)
ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'on_review';
ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'selesai';

-- 3. Add form_data jsonb column to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS form_data jsonb;

-- Verify
SELECT unnest(enum_range(NULL::loan_type)) AS loan_types;
SELECT unnest(enum_range(NULL::loan_status)) AS loan_statuses;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'form_data';
