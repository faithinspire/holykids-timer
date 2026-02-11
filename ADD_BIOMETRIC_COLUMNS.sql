-- ═══════════════════════════════════════════════════════════
-- ADD BIOMETRIC COLUMNS TO STAFF TABLE
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Add biometric_enrolled column (boolean, default false)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false;

-- Add fingerprint_id column (text, nullable)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;

-- Add enrolled_at column (timestamp, nullable)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_biometric_enrolled 
ON staff(biometric_enrolled) 
WHERE biometric_enrolled = true;

-- Update existing staff to have biometric_enrolled = false if NULL
UPDATE staff 
SET biometric_enrolled = false 
WHERE biometric_enrolled IS NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('biometric_enrolled', 'fingerprint_id', 'enrolled_at');

-- ═══════════════════════════════════════════════════════════
-- DONE! Now your staff table has biometric columns
-- ═══════════════════════════════════════════════════════════
