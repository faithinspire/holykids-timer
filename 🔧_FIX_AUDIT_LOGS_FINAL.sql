-- PERMANENT FIX: Disable RLS on audit_logs
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on audit_logs (safest for internal audit logging)
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might cause issues
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

-- 4. Test insert (should work now)
INSERT INTO audit_logs (action, details, timestamp)
VALUES ('test_audit', 'Testing audit log insert', NOW())
RETURNING id, action, timestamp;

-- If you see a row returned, audit_logs is working!
