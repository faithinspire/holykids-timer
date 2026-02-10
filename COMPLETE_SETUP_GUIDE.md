# HOLYKIDS Timer - Complete Setup Guide

## ✅ Step 1: Run SQL Migration in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `FINAL_SUPABASE_FIX.sql`
5. Click **Run**
6. Verify you see: "✅ Database updated successfully!"

## ✅ Step 2: Verify Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `holykids-timer`
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key

## ✅ Step 3: Redeploy

1. In Vercel dashboard, go to **Deployments**
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

## ✅ Step 4: Test the App

1. Open the app on your phone
2. **Clear browser cache**: Settings → Clear browsing data
3. Login with: `admin@holykids.edu` / `admin123`
4. Go to **Staff Management**
5. Click **+ Add Staff**
6. Fill in details and click **Add Staff**
7. You should see:
   - ✅ Success message
   - ✅ PIN displayed
   - ✅ Staff appears in the list
   - ✅ Data persists after refresh

## ✅ Step 5: Install as PWA

### On Android Chrome:
1. Open the app
2. Tap the **3 dots** menu
3. Tap **"Install app"** or **"Add to Home screen"**
4. Confirm installation
5. App icon appears on home screen with timer icon

### On iOS Safari:
1. Open the app
2. Tap the **Share** button
3. Tap **"Add to Home Screen"**
4. Confirm
5. App icon appears on home screen

## ✅ Features

- ✅ Staff registration with auto-generated PIN
- ✅ Biometric fingerprint enrollment
- ✅ PIN-based check-in
- ✅ Fingerprint check-in
- ✅ Dark mode (auto-switches at 6 PM)
- ✅ Beautiful gradient backgrounds
- ✅ PWA installable with timer icon
- ✅ Offline support with localStorage fallback
- ✅ Cloud sync with Supabase

## 🔧 Troubleshooting

### Staff not saving to database:
- Run `FINAL_SUPABASE_FIX.sql` in Supabase
- Verify environment variables in Vercel
- Check browser console for errors

### Dark mode not working:
- Clear browser cache
- Toggle manually using sun/moon icon
- Check if time is between 6 PM - 6 AM for auto-dark mode

### Install button not showing:
- Use HTTPS (Vercel provides this)
- Use Chrome/Safari (not all browsers support PWA)
- Check if already installed

## 📞 Support

Created by **Olushola Paul Odunuga**

For issues, check the browser console (F12) for error messages.
