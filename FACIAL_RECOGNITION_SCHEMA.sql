-- ========================================
-- HOLYKIDS FACIAL RECOGNITION SYSTEM
-- Database Schema for Supabase
-- ========================================

-- Drop old biometric columns if they exist
ALTER TABLE staff 
DROP COLUMN IF EXISTS biometric_enrolled,
DROP COLUMN IF EXISTS fingerprint_id,
DROP COLUMN IF EXISTS enrolled_at;

-- Add facial recognition columns
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS face_embedding TEXT, -- JSON string of face embedding vector
ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_hash TEXT; -- Hashed PIN for fallback

-- Update attendance table to track clock method
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS clock_method VARCHAR(20) DEFAULT 'face', -- 'face' or 'pin'
ADD COLUMN IF NOT EXISTS device_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS clock_type VARCHAR(20) DEFAULT 'check_in'; -- 'check_in' or 'check_out'

-- Create index for faster face embedding lookups
CREATE INDEX IF NOT EXISTS idx_staff_face_enrolled ON staff(face_enrolled) WHERE face_enrolled = TRUE;

-- Create index for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(clock_method);

-- Create failed attempts log table
CREATE TABLE IF NOT EXISTS failed_clock_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_type VARCHAR(20) NOT NULL, -- 'face' or 'pin'
  staff_id UUID REFERENCES staff(id),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  device_id VARCHAR(100),
  ip_address INET
);

-- Create index for failed attempts
CREATE INDEX IF NOT EXISTS idx_failed_attempts_date ON failed_clock_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_staff ON failed_clock_attempts(staff_id);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_clock_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
DROP POLICY IF EXISTS "Allow public read access to active staff" ON staff;
CREATE POLICY "Allow public read access to active staff" 
ON staff FOR SELECT 
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Allow authenticated insert on staff" ON staff;
CREATE POLICY "Allow authenticated insert on staff" 
ON staff FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow authenticated update on staff" ON staff;
CREATE POLICY "Allow authenticated update on staff" 
ON staff FOR UPDATE 
USING (TRUE);

-- RLS Policies for attendance table
DROP POLICY IF EXISTS "Allow public read access to attendance" ON attendance;
CREATE POLICY "Allow public read access to attendance" 
ON attendance FOR SELECT 
USING (TRUE);

DROP POLICY IF EXISTS "Allow public insert on attendance" ON attendance;
CREATE POLICY "Allow public insert on attendance" 
ON attendance FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow public update on attendance" ON attendance;
CREATE POLICY "Allow public update on attendance" 
ON attendance FOR UPDATE 
USING (TRUE);

-- RLS Policies for failed attempts
DROP POLICY IF EXISTS "Allow public insert on failed attempts" ON failed_clock_attempts;
CREATE POLICY "Allow public insert on failed attempts" 
ON failed_clock_attempts FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow public read on failed attempts" ON failed_clock_attempts;
CREATE POLICY "Allow public read on failed attempts" 
ON failed_clock_attempts FOR SELECT 
USING (TRUE);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check staff table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff'
ORDER BY ordinal_position;

-- Check attendance table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- Check failed attempts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'failed_clock_attempts'
ORDER BY ordinal_position;

-- ========================================
-- SAMPLE QUERIES
-- ========================================

-- Get all staff with face enrolled
SELECT id, staff_id, first_name, last_name, department, face_enrolled, face_enrolled_at
FROM staff
WHERE face_enrolled = TRUE AND is_active = TRUE;

-- Get today's attendance with clock method
SELECT 
  a.id,
  s.staff_id,
  s.first_name || ' ' || s.last_name AS staff_name,
  s.department,
  a.check_in_time,
  a.check_out_time,
  a.clock_method,
  a.clock_type
FROM attendance a
JOIN staff s ON a.staff_id = s.id
WHERE a.attendance_date = CURRENT_DATE
ORDER BY a.check_in_time DESC;

-- Get failed attempts in last 24 hours
SELECT 
  f.id,
  f.attempt_type,
  s.first_name || ' ' || s.last_name AS staff_name,
  f.attempted_at,
  f.reason
FROM failed_clock_attempts f
LEFT JOIN staff s ON f.staff_id = s.id
WHERE f.attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY f.attempted_at DESC;

-- ========================================
-- NOTES
-- ========================================
-- 1. face_embedding stores JSON string of face descriptor array
-- 2. pin_hash stores bcrypt hashed PIN (never store plain PIN)
-- 3. clock_method tracks if staff used face or PIN
-- 4. device_id helps track which device was used
-- 5. RLS policies allow public access for clock-in kiosk mode
-- 6. Failed attempts are logged for security monitoring
-- ========================================
