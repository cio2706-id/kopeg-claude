-- Migration: Add missing user_role enum values
-- Run this in Supabase SQL Editor to add staf_sekper and other missing roles
--
-- The schema.ts defines these roles but they may be missing from the database enum:
-- staf_sekper, staf_piutang, staf_akunting, sekertaris

-- Add staf_sekper (required for loan approval step 1: Review & Analisa Kredit)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staf_sekper' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'staf_sekper';
  END IF;
END
$$;

-- Add staf_piutang
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staf_piutang' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'staf_piutang';
  END IF;
END
$$;

-- Add staf_akunting
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staf_akunting' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'staf_akunting';
  END IF;
END
$$;

-- Add sekertaris
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sekertaris' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'sekertaris';
  END IF;
END
$$;

-- Verify: check all enum values after migration
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
