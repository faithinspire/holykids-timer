-- RUN THIS IN SUPABASE SQL EDITOR TO CHECK YOUR DATA

-- 1. Check if staff table exists and has data
SELECT 
  COUNT(*) as total_staff,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
  COUNT(CASE WHEN face_enrolled = true THEN 1 END) as face_enrolled_staff
FROM staff;

-- 2. Show all staff records
SELECT 
  id,
  staff_id,
  first_name,
  last_name,
  department,
  is_active,
  face_enrolled,
  created_at
FROM staff
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check RLS policies on staff table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'staff';

-- 4. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'staff';

-- IF STAFF TABLE IS EMPTY, RUN THIS TO ADD TEST DATA:
/*
INSERT INTO staff (staff_id, first_name, last_name, email, department, role, pin, is_active, date_joined)
VALUES 
  ('STF0001', 'John', 'Doe', 'john@holykids.edu', 'ICT', 'Teacher', '1234', true, CURRENT_DATE),
  ('STF0002', 'Jane', 'Smith', 'jane@holykids.edu', 'Mathematics', 'Teacher', '5678', true, CURRENT_DATE),
  ('STF0003', 'Bob', 'Johnson', 'bob@holykids.edu', 'English', 'Teacher', '9012', true, CURRENT_DATE);
*/

-- IF RLS IS BLOCKING READS, RUN THIS:
/*
-- Disable RLS temporarily for testing
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- Or create a permissive read policy
DROP POLICY IF EXISTS "Allow all reads on staff" ON staff;
CREATE POLICY "Allow all reads on staff"
ON staff
FOR SELECT
TO anon, authenticated
USING (true);
*/
