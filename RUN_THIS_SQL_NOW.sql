-- ========================================
-- FACIAL RECOGNITION DATABASE SETUP
-- Run this in Supabase SQL Editor NOW
-- ========================================

-- Add facial recognition columns to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS face_embedding TEXT,
ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Add clock method tracking to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS clock_method TEXT DEFAULT 'face',
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS clock_type TEXT DEFAULT 'check_in';

-- Create failed attempts tracking table
CREATE TABLE IF NOT EXISTS failed_clock_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  attempt_type TEXT NOT NULL,
  reason TEXT,
  device_id TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE failed_clock_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for failed attempts
CREATE POLICY "Allow all operations on failed_clock_attempts" 
ON failed_clock_attempts FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_face_enrolled ON staff(face_enrolled);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_method ON attendance(clock_method);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_staff ON failed_clock_attempts(staff_id);

-- Done! You should see "Success. No rows returned"
