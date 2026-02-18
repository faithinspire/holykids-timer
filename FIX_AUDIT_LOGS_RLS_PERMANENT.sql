-- ========================================
-- PERMANENT FIX: AUDIT LOGS RLS
-- Allow inserts without authentication
-- ========================================

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated inserts" ON audit_logs;
DROP POLICY IF EXISTS "Allow public inserts" ON audit_logs;
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public read on audit_logs" ON audit_logs;

-- Create policy to allow all inserts (no auth required)
CREATE POLICY "Allow all inserts on audit_logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- Create policy to allow authenticated reads
CREATE POLICY "Allow authenticated reads on audit_logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'audit_logs';

-- ========================================
-- NOTES:
-- 1. Inserts are now allowed without authentication
-- 2. This enables audit logging from API routes
-- 3. Reads require authentication for security
-- ========================================
