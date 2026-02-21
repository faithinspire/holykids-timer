-- ═══════════════════════════════════════════════════════════════════
-- 🔧 FIX ATTENDANCE TABLE - RUN THIS IN SUPABASE SQL EDITOR NOW
-- ═══════════════════════════════════════════════════════════════════

-- This fixes "Failed to record attendance" and "Staff not found" errors

-- 1. Ensure attendance_date column exists and has default
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS attendance_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- 2. Ensure status column exists with enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'on_leave');
    END IF;
END $$;

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS status attendance_status DEFAULT 'present';

-- 3. Ensure is_late column exists
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- 4. Ensure auth_method column exists
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pin';

-- 5. Ensure staff_name and staff_number columns exist (for reporting)
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS staff_name TEXT;

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS staff_number TEXT;

-- 6. Create index on attendance_date for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);

-- 7. Update existing records to have attendance_date if null
UPDATE attendance
SET attendance_date = DATE(check_in_time)
WHERE attendance_date IS NULL AND check_in_time IS NOT NULL;

-- 8. Update existing records to have status if null
UPDATE attendance
SET status = 'present'
WHERE status IS NULL;

-- 9. Fix RLS policies for attendance table
DROP POLICY IF EXISTS "Allow insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow read own attendance" ON attendance;
DROP POLICY IF EXISTS "Allow update own attendance" ON attendance;

-- Allow anyone to insert attendance (for clock-in)
CREATE POLICY "Allow insert attendance"
ON attendance FOR INSERT
WITH CHECK (true);

-- Allow anyone to read attendance
CREATE POLICY "Allow read attendance"
ON attendance FOR SELECT
USING (true);

-- Allow anyone to update attendance (for clock-out)
CREATE POLICY "Allow update attendance"
ON attendance FOR UPDATE
USING (true);

-- 10. Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ DONE! Now try clocking in again.
-- ═══════════════════════════════════════════════════════════════════
