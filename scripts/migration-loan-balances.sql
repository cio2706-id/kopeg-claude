-- Migration: Add loan_balances, monthly_deductions, and upload_logs tables
-- Run this in Supabase SQL Editor

-- Loan Balances: Imported from annual kertas kerja files
CREATE TABLE IF NOT EXISTS loan_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  loan_type VARCHAR(50) NOT NULL, -- reguler, khusus, barang, channeling_mandiri, channeling_bsi
  period VARCHAR(7) NOT NULL, -- "2025-12"
  saldo NUMERIC(15,2) DEFAULT 0,
  upload_batch_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Monthly Deductions: Per-member monthly potongan records
CREATE TABLE IF NOT EXISTS monthly_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  period VARCHAR(7) NOT NULL, -- "2026-01"
  source_file VARCHAR(100), -- bki_tetap, ids, kontrak_mns, sbu_industri, sbu_energi
  simpanan_amount NUMERIC(15,2) DEFAULT 0,
  pinjaman_amount NUMERIC(15,2) DEFAULT 0,
  upload_batch_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Upload Logs: Track all data uploads
CREATE TABLE IF NOT EXISTS upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_type VARCHAR(50) NOT NULL, -- simpanan_saldo, pinjaman_saldo, potongan_bulanan
  period VARCHAR(7) NOT NULL,
  file_name VARCHAR(255),
  sub_type VARCHAR(50), -- loan type or source file type
  record_count INTEGER DEFAULT 0,
  total_amount NUMERIC(15,2),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_loan_balances_user_period ON loan_balances(user_id, period);
CREATE INDEX IF NOT EXISTS idx_loan_balances_type_period ON loan_balances(loan_type, period);
CREATE INDEX IF NOT EXISTS idx_monthly_deductions_user_period ON monthly_deductions(user_id, period);
CREATE INDEX IF NOT EXISTS idx_monthly_deductions_source ON monthly_deductions(source_file, period);
