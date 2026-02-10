-- =================================================================
-- ADD PIN COLUMN TO STAFF TABLE
-- Run this in Supabase SQL Editor to fix staff registration
-- =================================================================

-- Add pin column to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS pin VARCHAR(10);

-- Add index for faster PIN lookups
CREATE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin);

-- Update existing staff with random PINs (optional - only if you have existing staff without PINs)
UPDATE staff 
SET pin = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE pin IS NULL;

-- Success message
SELECT 'PIN column added successfully! Staff registration will now save PINs.' as message;
