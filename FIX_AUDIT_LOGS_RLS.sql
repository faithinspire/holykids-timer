-- PERMANENT FIX: audit_logs RLS policy
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on audit_logs (simplest and safest for internal app)
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON audit_logs';
    END LOOP;
END $$;

-- 3. Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'audit_logs';

-- Should show "RLS Enabled" = false
