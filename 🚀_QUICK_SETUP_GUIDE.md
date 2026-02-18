# 🚀 QUICK SETUP GUIDE - FIX "Failed to fetch" ERROR

## PROBLEM
Your app shows: `Error: Failed to fetch (api.supabase.com)`

This means Supabase is not configured.

---

## ⚡ 5-MINUTE FIX

### Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com/dashboard
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - **Name**: `holykids-attendance`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. ⏳ Wait 2-3 minutes for setup

### Step 2: Setup Database (1 minute)

1. In your Supabase project, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy ALL the SQL from `SUPABASE_QUICK_SETUP.sql` file
4. Paste into the editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3: Fix RLS Policies (30 seconds)

1. Still in SQL Editor, click "New Query"
2. Copy ALL the SQL from `FIX_SUPABASE_RLS_POLICY.sql` file
3. Paste and click "Run"
4. You should see "Success"

### Step 4: Get Your Credentials (30 seconds)

1. Click "Settings" icon (⚙️) in left sidebar
2. Click "API" under Project Settings
3. You'll see two important values:

   **Project URL** (copy this):
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key** (copy this - it's a long string):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5: Configure Your App (1 minute)

#### For Local Development:

1. Open your project folder
2. Find the file `.env.local` (if it doesn't exist, create it)
3. Add these lines (replace with YOUR values from Step 4):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Save the file
5. Restart your dev server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

#### For Production (Render):

1. Go to https://dashboard.render.com
2. Select your web service
3. Click "Environment" in left sidebar
4. Click "Add Environment Variable"
5. Add first variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://xxxxxxxxxxxxx.supabase.co` (your URL)
6. Click "Add Environment Variable" again
7. Add second variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your key)
8. Click "Save Changes"
9. Render will automatically redeploy (takes 2-3 minutes)

#### For Production (Vercel):

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Add both variables (same as Render above)
5. Click "Save"
6. Go to "Deployments" tab
7. Click "..." on latest deployment → "Redeploy"

---

## ✅ TEST IT WORKS

### Local Test:
1. Open http://localhost:3000
2. Go to "Admin" → "Staff Management"
3. Click "Add Staff"
4. Fill in the form and click "Add Staff"
5. ✅ Should work without errors!

### Production Test:
1. Open your deployed URL
2. Same steps as above
3. ✅ Should work!

---

## 🔍 TROUBLESHOOTING

### Error: "Invalid API key"
- You copied the wrong key
- Go back to Supabase → Settings → API
- Make sure you copy the **anon public** key (not service_role)

### Error: "Project not found"
- Check your URL is correct
- Must be: `https://xxxxx.supabase.co`
- No trailing slash
- Must start with `https://`

### Still shows "Failed to fetch"
1. Check `.env.local` file exists in project root
2. Check there are no typos in variable names
3. Restart your dev server completely
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check Supabase project is active (not paused)

### Variables not loading
1. Make sure `.env.local` is in the project root (same folder as `package.json`)
2. Variable names must be EXACT: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. No spaces around the `=` sign
4. No quotes around the values

---

## 📋 CHECKLIST

- [ ] Created Supabase project
- [ ] Ran `SUPABASE_QUICK_SETUP.sql`
- [ ] Ran `FIX_SUPABASE_RLS_POLICY.sql`
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Added to `.env.local` (local)
- [ ] Added to Render/Vercel (production)
- [ ] Restarted dev server
- [ ] Tested staff registration
- [ ] ✅ Working!

---

## 🎯 WHAT YOU GET

After this setup:
- ✅ Staff registration works
- ✅ Face enrollment works
- ✅ Attendance tracking works
- ✅ Data syncs to cloud
- ✅ Reports work
- ✅ No more "Failed to fetch" errors

**Total time: 5 minutes**
**Difficulty: Easy**

---

Need help? Check the detailed guide in `⚠️_SUPABASE_NOT_CONFIGURED.md`
