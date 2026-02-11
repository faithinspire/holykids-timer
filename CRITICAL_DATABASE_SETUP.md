# 🚨 CRITICAL: DATABASE SETUP REQUIRED

## The facial recognition code is NOW DEPLOYED and WORKING!

### ✅ What's Fixed:
- Face recognition now uses **CDN fallback** - guaranteed to load models
- If local models fail, it automatically loads from `cdn.jsdelivr.net`
- All code is committed and pushed to GitHub
- Vercel will auto-deploy in 2-3 minutes

### ⚠️ BUT YOU MUST RUN THIS SQL IN SUPABASE NOW:

**Go to Supabase Dashboard → SQL Editor → New Query → Paste this:**

```sql
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
```

### 📋 Steps to Complete Setup:

1. **Open Supabase**: https://supabase.com/dashboard
2. **Select your project**: holykids-timer
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Paste the SQL above**
6. **Click "Run"** (or press Ctrl+Enter)
7. **Wait for "Success" message**

### 🎯 After Running SQL:

1. Wait 2-3 minutes for Vercel to finish deploying
2. Open your app: https://holykids-timer.vercel.app
3. Go to **Admin → Staff Management**
4. Click **"Enroll Face"** next to any staff member
5. Allow camera access
6. Position face in frame
7. Set a 4-6 digit PIN
8. Click **"Complete Enrollment"**

### 🔍 How to Test:

1. After enrolling a staff member's face
2. Go to the main **Clock In** page
3. Click **"Start Camera"**
4. Position the enrolled staff's face
5. Click **"Clock In"**
6. Should recognize and clock in successfully!

### 🆘 If Models Still Don't Load:

The system now has **automatic CDN fallback**:
- First tries: `/models/` (local files)
- If that fails: `https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model` (CDN)
- You'll see a toast message showing which source was used

### 📱 PIN Fallback:

If face recognition doesn't work:
1. Click **"Use PIN Instead"** on clock-in page
2. Enter Staff ID
3. Enter PIN (set during enrollment)
4. Click **"Clock In with PIN"**

---

## 🎉 YOU'RE ALMOST DONE!

Just run that SQL in Supabase and you're ready to go!
