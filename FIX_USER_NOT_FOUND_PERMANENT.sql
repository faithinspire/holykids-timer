-- ========================================
-- PERMANENT FIX: USER NOT FOUND ISSUE
-- Add user_id column to link staff to auth.users
-- ========================================

-- Step 1: Add user_id column to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- Step 3: Backfill existing staff records (if you have auth users)
-- This links staff to auth users by email matching
-- Run this ONLY if you have existing auth.users records
UPDATE staff s
SET user_id = au.id
FROM auth.users au
WHERE s.email = au.email
AND s.user_id IS NULL;

-- Step 4: Verify the changes
SELECT 
  id,
  staff_id,
  first_name,
  last_name,
  email,
  user_id,
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not Linked'
  END as link_status
FROM staff
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- NOTES:
-- 1. user_id links staff records to Supabase Auth users
-- 2. This enables proper authentication flow
-- 3. Face enrollment will now work for logged-in users
-- 4. Staff lookup uses: WHERE user_id = auth.uid()
-- ========================================
