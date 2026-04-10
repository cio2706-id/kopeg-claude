-- ============================================================================
-- Schema Migration - Run in Supabase SQL Editor
-- Idempotent - safe to re-run. Apply this whenever schema.ts adds new columns.
-- ============================================================================

-- 1. Add simpanan_khusus and shu columns to savings table
ALTER TABLE savings ADD COLUMN IF NOT EXISTS simpanan_khusus numeric(15,2) DEFAULT 0;
ALTER TABLE savings ADD COLUMN IF NOT EXISTS shu numeric(15,2) DEFAULT 0;

-- 2. Add public PO requester columns and make user_id nullable
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_name varchar(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_divisi varchar(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_nip varchar(50);
ALTER TABLE purchase_orders ALTER COLUMN user_id DROP NOT NULL;

-- 3. Payment proof upload column for PO completion flow.
--    Staf Akunting completes a PO from "waiting_payment" by uploading bukti
--    pembayaran (payment proof image). Fixes the "column payment_proof_url
--    does not exist" error seen when pengurus opens the dashboard.
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
