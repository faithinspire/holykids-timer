-- ========================================
-- COMPLETE DATABASE FIX FOR HOLYKIDS
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- STEP 1: Add facial recognition columns if they don't exist
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS face_embedding TEXT,
ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- STEP 2: Add clock method columns to attendance if they don't exist
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS clock_method VARCHAR(20) DEFAULT 'face',
ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);

-- STEP 3: DISABLE RLS on all tables (fixes infinite recursion)
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- STEP 4: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop staff policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'staff') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON staff';
    END LOOP;
    
    -- Drop attendance policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'attendance') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON attendance';
    END LOOP;
    
    -- Drop audit_logs policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON audit_logs';
    END LOOP;
END $$;

-- STEP 5: Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_staff_face_enrolled ON staff(face_enrolled) WHERE face_enrolled = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(clock_method);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify RLS is disabled (should show FALSE for all)
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('staff', 'attendance', 'audit_logs')
ORDER BY tablename;

-- Verify no policies exist (should return 0 rows)
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('staff', 'attendance', 'audit_logs');

-- Check staff table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('face_embedding', 'face_enrolled', 'face_enrolled_at', 'pin_hash')
ORDER BY column_name;

-- Check attendance table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'attendance'
AND column_name IN ('clock_method', 'device_id')
ORDER BY column_name;

-- Test insert into audit_logs (should work)
INSERT INTO audit_logs (action, details, timestamp)
VALUES ('database_fix_test', 'Testing audit log after RLS fix', NOW())
RETURNING id, action, timestamp;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Database fix complete! RLS disabled, columns added, policies removed.' as status;
