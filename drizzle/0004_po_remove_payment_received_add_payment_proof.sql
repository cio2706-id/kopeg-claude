-- Migration: Simplify PO payment flow
-- Remove the staf_treasury "payment_received" step.
-- Staf Akunting now directly completes PO from "waiting_payment"
-- by uploading bukti pembayaran (payment proof image).

-- Add payment_proof_url column to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
