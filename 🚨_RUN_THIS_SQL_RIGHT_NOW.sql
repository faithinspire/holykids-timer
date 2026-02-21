-- ═══════════════════════════════════════════════════════════════════
-- 🚨 COPY THIS ENTIRE SQL AND RUN IN SUPABASE NOW!
-- ═══════════════════════════════════════════════════════════════════
-- This fixes: "Could not find the 'auth_method' column"
-- ═══════════════════════════════════════════════════════════════════

-- Add ALL missing columns to attendance table
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present',
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pin',
ADD COLUMN IF NOT EXISTS staff_name TEXT,
ADD COLUMN IF NOT EXISTS staff_number TEXT;

-- Update existing records
UPDATE attendance 
SET attendance_date = DATE(check_in_time) 
WHERE attendance_date IS NULL AND check_in_time IS NOT NULL;

UPDATE attendance 
SET status = 'present' 
WHERE status IS NULL;

-- Fix RLS policies
DROP POLICY IF EXISTS "Allow insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow update attendance" ON attendance;

CREATE POLICY "Allow insert attendance" 
ON attendance FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read attendance" 
ON attendance FOR SELECT 
USING (true);

CREATE POLICY "Allow update attendance" 
ON attendance FOR UPDATE 
USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- ✅ DONE! Now try clocking in again.
-- ═══════════════════════════════════════════════════════════════════
