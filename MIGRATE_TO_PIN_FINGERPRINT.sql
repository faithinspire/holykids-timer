-- Migration: Remove Face Recognition, Add PIN + Fingerprint Authentication
-- Run this in Supabase SQL Editor

-- 1. Add biometric_credential_id column if not exists
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS biometric_credential_id TEXT;

-- 2. Add auth_method column to attendance if not exists
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pin+fingerprint';

-- 3. Remove face-related columns (optional - keep for data migration)
-- ALTER TABLE staff DROP COLUMN IF EXISTS face_embedding;
-- ALTER TABLE staff DROP COLUMN IF EXISTS face_enrolled;
-- ALTER TABLE staff DROP COLUMN IF EXISTS face_enrolled_at;

-- 4. Ensure biometric_enrolled column exists
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false;

-- 5. Add index on biometric_credential_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_biometric_credential 
ON staff(biometric_credential_id);

-- 6. Update RLS policies for attendance table
-- Allow inserts for clock-in/out
DROP POLICY IF EXISTS "Allow attendance inserts" ON attendance;
CREATE POLICY "Allow attendance inserts"
ON attendance
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reads for own attendance
DROP POLICY IF EXISTS "Allow read own attendance" ON attendance;
CREATE POLICY "Allow read own attendance"
ON attendance
FOR SELECT
TO authenticated
USING (true);

-- 7. Ensure audit_logs allows inserts
DROP POLICY IF EXISTS "Allow all inserts on audit_logs" ON audit_logs;
CREATE POLICY "Allow all inserts on audit_logs"
ON audit_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 8. Verify staff table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff'
ORDER BY ordinal_position;

-- 9. Verify attendance table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- 10. Show current staff with biometric status
SELECT 
  staff_id,
  first_name,
  last_name,
  biometric_enrolled,
  biometric_credential_id IS NOT NULL as has_credential,
  is_active
FROM staff
ORDER BY created_at DESC;
