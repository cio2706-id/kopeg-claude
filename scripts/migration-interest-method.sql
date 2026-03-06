-- Migration: Add interest_method column to loans table
-- Supports 3 interest calculation methods: flat (tetap), efektif, sliding (menurun)

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE interest_method AS ENUM ('flat', 'efektif', 'sliding');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add column with default 'flat' (matching existing koperasi behavior)
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS interest_method interest_method NOT NULL DEFAULT 'flat';
