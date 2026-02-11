# 🔧 Supabase Setup Guide - Add Biometric Columns

## The Problem

Your Supabase database is missing these columns:
- `biometric_enrolled` (boolean)
- `fingerprint_id` (text)
- `enrolled_at` (timestamp)

That's why you're getting the error: "couldn't find enrolled_at column"

---

## The Solution

Add these columns to your Supabase `staff` table using SQL.

---

## Step-by-Step Instructions

### Step 1: Login to Supabase

1. Go to: https://supabase.com
2. Click "Sign In"
3. Login with your credentials
4. You'll see your dashboard

### Step 2: Select Your Project

1. Click on your project (HOLYKIDS or whatever you named it)
2. You'll see the project dashboard

### Step 3: Open SQL Editor

1. Look at the left sidebar
2. Click on "SQL Editor" (icon looks like `</>`)
3. Click the "+ New query" button at the top

### Step 4: Copy the SQL

Open the file `ADD_BIOMETRIC_COLUMNS.sql` and copy this SQL:

```sql
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false;

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_staff_biometric_enrolled 
ON staff(biometric_enrolled) 
WHERE biometric_enrolled = true;

UPDATE staff 
SET biometric_enrolled = false 
WHERE biometric_enrolled IS NULL;
```

### Step 5: Paste and Run

1. Paste the SQL into the editor
2. Click the "Run" button (or press `Ctrl+Enter`)
3. Wait a few seconds
4. You should see: "Success. No rows returned"

### Step 6: Verify It Worked

Run this verification query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('biometric_enrolled', 'fingerprint_id', 'enrolled_at');
```

You should see 3 rows:
- `biometric_enrolled` | `boolean`
- `fingerprint_id` | `text`
- `enrolled_at` | `timestamp with time zone`

---

## After Adding Columns

### Test Enrollment:

1. Go to your app: https://holykids-timer.vercel.app
2. Refresh the page (Ctrl+Shift+R)
3. Go to Staff Management
4. Click "Setup" under Biometric for a staff member
5. Click "Enroll Now"
6. Should see "✅ Success!" (no more error!)

### Test Clock-In:

1. Go to Clock In page
2. Should see "✅ 1 staff enrolled"
3. Click "Scan Fingerprint"
4. Should work! ✅

---

## Troubleshooting

### Error: "relation 'staff' does not exist"

Your table might be named differently. Check your table name:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Error: "permission denied"

You need to be the project owner or have admin access.

### Columns Already Exist

If you see "column already exists", that's fine! The `IF NOT EXISTS` clause prevents errors.

---

## What These Columns Do

### `biometric_enrolled` (boolean)
- `true` = Staff has enrolled fingerprint
- `false` = Staff has not enrolled yet
- Default: `false`

### `fingerprint_id` (text)
- Stores unique fingerprint identifier
- Format: `fp_STF1234_1234567890`
- Nullable (empty until enrolled)

### `enrolled_at` (timestamp)
- Records when fingerprint was enrolled
- Format: `2026-02-10T14:30:00Z`
- Nullable (empty until enrolled)

---

## Quick Reference

### Add Columns:
```sql
ALTER TABLE staff ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;
```

### Check Columns:
```sql
SELECT * FROM staff LIMIT 1;
```

### View Enrolled Staff:
```sql
SELECT first_name, last_name, biometric_enrolled, enrolled_at 
FROM staff 
WHERE biometric_enrolled = true;
```

---

## Summary

1. ✅ Open Supabase SQL Editor
2. ✅ Run `ADD_BIOMETRIC_COLUMNS.sql`
3. ✅ Verify columns added
4. ✅ Test enrollment in app
5. ✅ Test clock-in in app
6. ✅ Everything works!

---

**After running the SQL, your biometric system will work perfectly!**
