-- Migration: Add 'antrian_pembayaran' to loan_status enum
-- This new status sits between SPP completion and disbursement.
-- After SPP is approved, loans go to 'antrian_pembayaran' (Payment Queue).
-- Staff Treasury then manually moves them to 'disbursed'.

ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'antrian_pembayaran' BEFORE 'disbursed';
