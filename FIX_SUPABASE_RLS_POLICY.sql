-- FIX: Infinite recursion in staff table RLS policy
-- Run this in Supabase SQL Editor

-- 1. Drop all existing policies on staff table
DROP POLICY IF EXISTS "Enable read access for all users" ON staff;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON staff;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON staff;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON staff;
DROP POLICY IF EXISTS "Allow public read access" ON staff;
DROP POLICY IF EXISTS "Allow public insert" ON staff;
DROP POLICY IF EXISTS "Allow public update" ON staff;
DROP POLICY IF EXISTS "Allow public delete" ON staff;

-- 2. Create simple, non-recursive policies
CREATE POLICY "Allow all operations on staff"
ON staff
FOR ALL
USING (true)
WITH CHECK (true);

-- Alternative: If you want authentication, use this instead:
-- CREATE POLICY "Allow authenticated operations on staff"
-- ON staff
-- FOR ALL
-- USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
-- WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. Ensure RLS is enabled
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- 4. Do the same for attendance table
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON attendance;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON attendance;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON attendance;

CREATE POLICY "Allow all operations on attendance"
ON attendance
FOR ALL
USING (true)
WITH CHECK (true);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 5. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('staff', 'attendance')
ORDER BY tablename, policyname;
