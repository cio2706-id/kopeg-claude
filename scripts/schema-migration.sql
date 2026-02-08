-- ============================================================================
-- Schema Migration - Run in Supabase SQL Editor
-- Adds new columns for simpanan khusus, SHU, and public PO requests
-- ============================================================================

-- 1. Add simpanan_khusus and shu columns to savings table
ALTER TABLE savings ADD COLUMN IF NOT EXISTS simpanan_khusus numeric(15,2) DEFAULT 0;
ALTER TABLE savings ADD COLUMN IF NOT EXISTS shu numeric(15,2) DEFAULT 0;

-- 2. Add public PO requester columns and make user_id nullable
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_name varchar(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_divisi varchar(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requester_nip varchar(50);
ALTER TABLE purchase_orders ALTER COLUMN user_id DROP NOT NULL;
