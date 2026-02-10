-- ============================================
-- FINAL FIX FOR HOLYKIDS ATTENDANCE SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add PIN column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'pin'
    ) THEN
        ALTER TABLE staff ADD COLUMN pin VARCHAR(10);
        RAISE NOTICE 'PIN column added successfully';
    ELSE
        RAISE NOTICE 'PIN column already exists';
    END IF;
END $$;

-- 2. Add biometric columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'biometric_enrolled'
    ) THEN
        ALTER TABLE staff ADD COLUMN biometric_enrolled BOOLEAN DEFAULT false;
        RAISE NOTICE 'biometric_enrolled column added';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'biometric_id'
    ) THEN
        ALTER TABLE staff ADD COLUMN biometric_id TEXT;
        RAISE NOTICE 'biometric_id column added';
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin);
CREATE INDEX IF NOT EXISTS idx_staff_biometric_id ON staff(biometric_id);
CREATE INDEX IF NOT EXISTS idx_staff_biometric_enrolled ON staff(biometric_enrolled);

-- 4. Update existing staff with random PINs if they don't have one
UPDATE staff 
SET pin = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE pin IS NULL AND is_active = true;

-- 5. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'staff' 
AND column_name IN ('pin', 'biometric_enrolled', 'biometric_id')
ORDER BY column_name;

-- 6. Show sample data
SELECT 
    staff_id,
    first_name,
    last_name,
    pin,
    biometric_enrolled,
    is_active
FROM staff
LIMIT 5;

-- Success message
SELECT '✅ Database updated successfully! Staff registration with PIN and biometric should now work.' as status;
