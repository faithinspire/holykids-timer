# 🚀 QUICK FIX GUIDE

## Issue 1: Staff Not Loading ⚠️

### Test First
Visit: `https://holykids-timer-1.onrender.com/test-staff-api`

### Fix A: Environment Variables Missing
**Symptoms:** Diagnostic shows "Database Not Connected"

**Solution:**
1. Go to Render.com dashboard
2. Select your service (holykids-timer-1)
3. Click "Environment" tab
4. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Get values from Supabase → Settings → API
6. Click "Save Changes"
7. Wait 2-3 minutes for redeploy

### Fix B: Staff Table Empty
**Symptoms:** Diagnostic shows "Staff Count: 0"

**Solution:**
1. Go to Supabase.com
2. Select your project
3. Click "Table Editor" → "staff"
4. Click "Insert" → "Insert row"
5. Fill in:
   - staff_id: STF0001
   - first_name: John
   - last_name: Doe
   - department: ICT
   - role: Teacher
   - pin: 1234
   - is_active: true
6. Click "Save"

### Fix C: Browser Cache
**Symptoms:** Everything works in test page but not in UI

**Solution:**
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or:
   - Press F12 to open DevTools
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

---

## Issue 2: Camera Not Capturing ✅ FIXED

### What Was Fixed
- Better video readiness checking
- Enhanced capture logic
- Auto-stops camera after capture
- Improved error messages

### How to Test
1. Go to `/admin/staff`
2. Click "Setup Face" on any staff
3. Click "Start Camera"
4. Wait for "Camera ready!" message
5. Click "Capture Face"
6. Should see captured image

### If Still Not Working
Check console (F12) for errors:
- Camera permission denied → Allow camera
- Camera in use → Close other apps
- Video dimensions 0x0 → Restart camera

---

## Quick Commands

### Deploy Changes
```bash
git add .
git commit -m "Your message"
git push origin main
```

### Check Deployment Status
Go to Render dashboard → Your service → "Logs" tab

### Clear Local Cache
```bash
# Windows
Ctrl + Shift + R

# Mac
Cmd + Shift + R
```

---

## Test URLs

### Local Development
- Test Page: `http://localhost:3000/test-staff-api`
- Diagnostic: `http://localhost:3000/api/diagnostic`
- Staff API: `http://localhost:3000/api/staff`

### Production (Render)
- Test Page: `https://holykids-timer-1.onrender.com/test-staff-api`
- Diagnostic: `https://holykids-timer-1.onrender.com/api/diagnostic`
- Staff API: `https://holykids-timer-1.onrender.com/api/staff`

---

## What to Report

When asking for help, provide:

1. **Test page results:**
   - Screenshot or copy-paste JSON results
   - Database connected? (Yes/No)
   - Staff count? (Number)

2. **Console errors:**
   - Press F12 → Console tab
   - Copy any red error messages

3. **Network errors:**
   - Press F12 → Network tab
   - Look for failed requests (red)
   - Click on them and copy error details

This helps identify the exact problem quickly!
