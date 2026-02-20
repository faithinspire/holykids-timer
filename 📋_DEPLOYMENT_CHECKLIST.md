# 📋 DEPLOYMENT CHECKLIST

## Pre-Deployment

### 1. Local Testing
- [ ] Run `npm run dev` locally
- [ ] Visit `http://localhost:3000/troubleshoot`
- [ ] Check environment variables show as ✅
- [ ] Test staff loading at `/admin/staff`
- [ ] Test camera capture in face enrollment
- [ ] Check browser console for errors

### 2. Environment Variables
- [ ] `.env.local` exists locally
- [ ] Contains `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Values match Supabase dashboard

### 3. Database Setup
- [ ] Supabase project created
- [ ] Staff table exists
- [ ] At least one staff record added
- [ ] RLS policies configured
- [ ] Audit logs table exists

### 4. Code Quality
- [ ] No TypeScript errors: `npm run build`
- [ ] All changes committed: `git status`
- [ ] Pushed to GitHub: `git push origin main`

---

## Render Deployment

### 1. Create Service (First Time Only)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** holykids-timer-1 (or your choice)
   - **Branch:** main
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 2. Environment Variables
1. In Render dashboard → Your service
2. Go to "Environment" tab
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Get values from:
   - Supabase Dashboard → Settings → API
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. Click "Save Changes"
6. Wait for automatic redeploy (2-3 minutes)

### 3. Verify Deployment
1. Check "Logs" tab for deployment status
2. Look for "Build successful" message
3. Wait for "Service is live" message
4. Note your deployment URL

---

## Post-Deployment Testing

### 1. Basic Connectivity
- [ ] Visit your Render URL
- [ ] Page loads without errors
- [ ] No red error banner at top

### 2. Troubleshoot Page
- [ ] Visit `/troubleshoot`
- [ ] Environment variables show ✅
- [ ] Database shows as connected
- [ ] Staff count > 0

### 3. Test APIs
- [ ] Visit `/test-staff-api`
- [ ] Click "Test /api/diagnostic"
- [ ] Should show `"connected": true`
- [ ] Click "Test /api/staff"
- [ ] Should return staff array

### 4. Admin Functions
- [ ] Visit `/admin/staff`
- [ ] Staff list loads (no infinite spinner)
- [ ] Can add new staff
- [ ] Can view staff PIN
- [ ] Can click "Setup Face"

### 5. Face Enrollment
- [ ] Click "Setup Face" on a staff
- [ ] Camera starts successfully
- [ ] Can capture face
- [ ] Can set PIN
- [ ] Enrollment completes

### 6. Face Clock-In
- [ ] Visit `/face-clock-in`
- [ ] Camera starts
- [ ] Face recognition works
- [ ] Clock-in successful

---

## Troubleshooting Deployment Issues

### Issue: Build Fails
**Check:**
- Render logs for error messages
- Run `npm run build` locally
- Fix any TypeScript errors
- Commit and push fixes

### Issue: Environment Variables Not Working
**Check:**
- Variables are in "Environment" tab (not "Environment Groups")
- Variable names are exact (case-sensitive)
- No extra spaces in values
- Clicked "Save Changes"
- Waited for redeploy to complete

### Issue: Database Not Connected
**Check:**
- Supabase URL is correct (starts with https://)
- Anon key is correct (long JWT string)
- Supabase project is not paused
- RLS policies allow access

### Issue: Staff Not Loading
**Check:**
- Staff table has records
- Records have `is_active = true`
- Visit `/api/staff` directly to see error
- Check Render logs for errors

### Issue: Changes Not Showing
**Solutions:**
- Wait 2-3 minutes for deployment
- Check Render logs for completion
- Clear browser cache (Ctrl+Shift+R)
- Try incognito mode
- Verify changes are on GitHub

---

## Maintenance

### Regular Updates
```bash
# Make changes
git add .
git commit -m "Description of changes"
git push origin main

# Render auto-deploys from GitHub
# Wait 2-3 minutes
# Test on deployed site
```

### Monitoring
- Check Render logs regularly
- Monitor error rates
- Test critical features weekly
- Keep Supabase project active

### Backups
- Export staff data from Supabase monthly
- Keep local copy of environment variables
- Document any custom configurations

---

## Quick Commands

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Check for errors
npm run build
```

### Git Operations
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# View recent commits
git log --oneline -5
```

### Environment Setup
```bash
# Windows
CHECK_ENV.bat
SETUP_ENV.bat

# Manual
copy .env.local.example .env.local
# Edit .env.local with your values
```

---

## Support Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)

### Troubleshooting
- App: `/troubleshoot`
- Test APIs: `/test-staff-api`
- Diagnostics: `/api/diagnostic`

### Dashboards
- [Render Dashboard](https://dashboard.render.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Repository](https://github.com/faithinspire/holykids-timer)

---

## Success Criteria

✅ Deployment completes without errors
✅ Environment variables configured
✅ Database connected
✅ Staff data loads
✅ Camera works
✅ Face enrollment works
✅ Face clock-in works
✅ No console errors
✅ All tests pass

When all criteria are met, your app is successfully deployed! 🎉
