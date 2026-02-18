# ⚠️ SUPABASE NOT CONFIGURED

## ERROR
```
Error: Failed to fetch (api.supabase.com)
```

## CAUSE
Your Supabase environment variables are either:
1. Not set in your `.env.local` file
2. Set incorrectly
3. Not deployed to Render/Vercel

---

## FIX 1: LOCAL DEVELOPMENT

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create one if you don't have it)
3. Click the "Settings" icon (⚙️) in the left sidebar
4. Click "API" under Project Settings
5. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 2: Update .env.local

Open your `.env.local` file and add/update these lines:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 1.

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## FIX 2: PRODUCTION DEPLOYMENT (RENDER/VERCEL)

### For Render:

1. Go to your Render dashboard
2. Select your web service
3. Click "Environment" in the left sidebar
4. Add these environment variables:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your-anon-key-here`

5. Click "Save Changes"
6. Render will automatically redeploy

### For Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Add these variables:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your-anon-key-here`

5. Click "Save"
6. Redeploy your project

---

## FIX 3: CREATE SUPABASE PROJECT (IF YOU DON'T HAVE ONE)

### Step 1: Create Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `holykids-attendance`
   - Database Password: (create a strong password)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 2: Create Tables

1. Click "SQL Editor" in the left sidebar
2. Copy the contents of `SUPABASE_QUICK_SETUP.sql`
3. Paste into the SQL Editor
4. Click "Run"

This creates the `staff` and `attendance` tables.

### Step 3: Fix RLS Policies

1. Still in SQL Editor
2. Copy the contents of `FIX_SUPABASE_RLS_POLICY.sql`
3. Paste and click "Run"

This fixes the infinite recursion error.

### Step 4: Get Your Credentials

1. Click "Settings" → "API"
2. Copy:
   - Project URL
   - anon public key
3. Add to `.env.local` (see Fix 1 above)

---

## VERIFY IT'S WORKING

### Test Locally:

1. Start your dev server: `npm run dev`
2. Open http://localhost:3000
3. Go to Admin → Staff Management
4. Try to add a new staff member
5. Should work without errors

### Test in Production:

1. After deploying with environment variables
2. Open your deployed URL
3. Try the same staff registration
4. Should work

---

## COMMON ISSUES

### Issue 1: "Invalid API key"
- Double-check you copied the **anon public** key, not the service_role key
- Make sure there are no extra spaces in the key

### Issue 2: "Project not found"
- Verify the URL is correct: `https://xxxxx.supabase.co`
- No trailing slash
- Must start with `https://`

### Issue 3: Still getting "Failed to fetch"
- Clear browser cache
- Restart dev server
- Check browser console for exact error
- Verify Supabase project is active (not paused)

---

## QUICK CHECK

Run this in your browser console on your app:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
```

Both should show values. If "NOT SET", your environment variables aren't loaded.

---

## NEED HELP?

1. Check `.env.local` exists in project root
2. Check `.env.local` is NOT in `.gitignore` (it should be, but you need it locally)
3. Restart your terminal/IDE after adding environment variables
4. Make sure you're using the correct Supabase project

**After fixing, the app will connect to Supabase successfully!**
