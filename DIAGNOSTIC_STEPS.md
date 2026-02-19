# 🔍 DIAGNOSTIC STEPS - STAFF NOT LOADING

## Current Issue
The `/admin/staff` page shows infinite loading with "Staff not found" error on the deployed site (holykids-timer-1.onrender.com).

## Step 1: Check Diagnostic Endpoint
Open this URL in your browser:
```
https://holykids-timer-1.onrender.com/api/diagnostic
```

This will show:
- ✅ Environment variables are set correctly
- ✅ Database connection status
- ✅ Number of staff in database
- ✅ Sample staff records

## Step 2: Check Staff API Directly
Open this URL in your browser:
```
https://holykids-timer-1.onrender.com/api/staff
```

This should return JSON with your staff list. If it returns an error, that's the problem.

## Step 3: Verify Supabase Configuration

### On Render.com:
1. Go to your Render dashboard
2. Click on your service (holykids-timer-1)
3. Go to "Environment" tab
4. Verify these variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL` (should start with https://)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (long string)

### On Supabase:
1. Go to your Supabase project
2. Click "Settings" → "API"
3. Copy the values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Make sure they match what's on Render

## Step 4: Check Staff Table
1. Go to Supabase → Table Editor → staff table
2. Verify:
   - ✅ Table has records
   - ✅ Records have `is_active = true`
   - ✅ Records have all required columns (id, staff_id, first_name, last_name, department, etc.)

## Step 5: Clear Browser Cache
After any changes:
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or open DevTools (F12) → Network tab → Check "Disable cache"

## Expected Results

### If Diagnostic Shows "connected: false"
→ Environment variables are missing or incorrect on Render

### If Diagnostic Shows "staffCount: 0"
→ Staff table is empty in Supabase, need to add staff

### If Staff API Returns Error
→ Database query is failing, check RLS policies

### If Everything Looks Good But UI Still Broken
→ Browser cache issue, clear cache and hard refresh

## Quick Fix Commands

If you need to redeploy:
```bash
git add .
git commit -m "Fix staff loading"
git push origin main
```

Then on Render, it should auto-deploy. Wait 2-3 minutes for deployment to complete.
