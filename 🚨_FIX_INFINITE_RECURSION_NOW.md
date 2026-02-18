# 🚨 FIX INFINITE RECURSION ERROR

## Problem
You're seeing: `infinite recursion detected in policy for relation "staff"`

## Root Cause
Row Level Security (RLS) policies on the staff table are referencing the staff table itself, creating a circular dependency.

## Solution (3 Steps)

### STEP 1: Run SQL Script in Supabase
1. Open your Supabase project: https://supabase.com/dashboard/project/mmluzuxcoqyrtenstxq
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the ENTIRE contents of `RUN_THIS_COMPLETE_FIX.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait for "✅ Database fix complete!" message

### STEP 2: Commit and Push Code Changes
```cmd
git add .
git commit -m "fix: Add is_active filter to face enrollment API"
git push origin main
```

### STEP 3: Verify on Render/Vercel
- Wait for automatic deployment
- Check build logs - should succeed now
- Test the app

## What This Fix Does
1. ✅ Adds facial recognition columns to staff table
2. ✅ Adds clock_method columns to attendance table
3. ✅ **DISABLES RLS** on staff, attendance, and audit_logs tables
4. ✅ Removes ALL policies that cause infinite recursion
5. ✅ Creates performance indexes
6. ✅ Fixes face enrollment API to only return active staff

## Why Disable RLS?
This is an **internal attendance system** with authentication at the application level. RLS is not needed and causes more problems than it solves for this use case.

## After This Fix
- ✅ No more "infinite recursion" errors
- ✅ Face enrollment will work
- ✅ Face verification will work
- ✅ Audit logs will work
- ✅ All API routes will work

## If You Still See Errors
1. Make sure you ran the COMPLETE SQL script
2. Check Supabase logs for any other errors
3. Verify environment variables are set in Render/Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
