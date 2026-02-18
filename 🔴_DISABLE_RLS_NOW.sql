-- EMERGENCY FIX: Disable RLS completely to stop infinite recursion
-- Run this in Supabase SQL Editor NOW

-- 1. DISABLE RLS on staff table
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 2. DISABLE RLS on attendance table
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- 3. DISABLE RLS on audit_logs table
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL policies (just to be sure)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'staff') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON staff';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'attendance') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON attendance';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON audit_logs';
    END LOOP;
END $$;

-- 4. Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('staff', 'attendance', 'audit_logs');

-- You should see "RLS Enabled" = false for all three tables

-- 5. Verify no policies exist
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('staff', 'attendance', 'audit_logs');

-- Should return 0 rows
