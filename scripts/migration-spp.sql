-- Migration: Add SPP (Surat Permintaan Pembayaran) tables
-- Run this in Supabase SQL Editor

-- 1. Create SPP status enum
DO $$ BEGIN
  CREATE TYPE spp_status AS ENUM ('draft', 'pending_manager', 'pending_bendahara', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create SPP table
CREATE TABLE IF NOT EXISTS spp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spp_number VARCHAR(50) UNIQUE NOT NULL,
  reference_type VARCHAR(50), -- 'loan', 'purchase_order', or NULL for standalone
  reference_id UUID,
  unit_kerja VARCHAR(255) DEFAULT 'KOPERASI PEGAWAI BIRO KLASIFIKASI INDONESIA',
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payable_to VARCHAR(255) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  amount_in_words TEXT,
  supporting_docs TEXT DEFAULT 'Terlampir',
  -- Tax withholding (PPh 23)
  has_pph23 BOOLEAN DEFAULT FALSE,
  pph_details JSONB,
  total_invoice NUMERIC(15,2),
  pph_due NUMERIC(15,2),
  -- Status & workflow
  status spp_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by_treasury UUID REFERENCES users(id),
  approved_by_treasury_at TIMESTAMPTZ,
  approved_by_manager UUID REFERENCES users(id),
  approved_by_manager_at TIMESTAMPTZ,
  approved_by_bendahara UUID REFERENCES users(id),
  approved_by_bendahara_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create SPP items table
CREATE TABLE IF NOT EXISTS spp_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spp_id UUID NOT NULL REFERENCES spp(id) ON DELETE CASCADE,
  account_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_spp_status ON spp(status);
CREATE INDEX IF NOT EXISTS idx_spp_reference ON spp(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_spp_created_by ON spp(created_by);
CREATE INDEX IF NOT EXISTS idx_spp_items_spp_id ON spp_items(spp_id);

-- 5. Add spp_id reference to loans and purchase_orders (optional link back)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS spp_id UUID REFERENCES spp(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS spp_id UUID REFERENCES spp(id);
