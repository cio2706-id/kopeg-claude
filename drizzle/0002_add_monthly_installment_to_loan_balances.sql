-- Migration: Add monthly_installment column to loan_balances table
-- The schema.ts defines this column but it's missing from the actual database

ALTER TABLE loan_balances
ADD COLUMN IF NOT EXISTS monthly_installment numeric(15, 2);
