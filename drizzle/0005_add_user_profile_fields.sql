-- Migration: Add personal/profile fields to users table
-- These fields are filled by anggota on their first login (profile setup wizard).
-- profile_completed and password_changed flags gate the first-time onboarding flow.

ALTER TABLE users ADD COLUMN IF NOT EXISTS nik VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing pengurus accounts should not be forced through the wizard.
-- Mark all non-member accounts as already having a completed profile so they
-- can keep using the system normally; only role = 'member' must complete it.
UPDATE users SET profile_completed = TRUE, password_changed = TRUE
WHERE role <> 'member';
