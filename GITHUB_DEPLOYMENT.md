# Deploy HOLYKIDS Attendance System to GitHub & Any Hosting

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and login
2. Click **"+"** → **"New repository"**
3. Repository name: `holykids-attendance`
4. Set to **Public** or **Private**
5. Click **"Create repository"**

## Step 2: Push Code to GitHub

Run these commands in Command Prompt (run as Administrator):

```cmd
cd "c:\Users\User\TIME ATTENDANCE"

git init
git add .
git commit -m "HOLYKIDS Attendance System - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/holykids-attendance.git
git push -u origin main
```

**If you get "access denied":**
```cmd
git remote set-url origin https://ghp_TOKEN@github.com/YOUR_USERNAME/holykids-attendance.git
```
Replace `TOKEN` with your GitHub Personal Access Token.

## Step 3: Get GitHub Token (if needed)

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click **"Generate new token (classic)"**
3. Note: `repo` (full control)
4. Copy the token and use it in the URL above

---

## Deploy to Vercel (Recommended - Free)

1. Go to [Vercel](https://vercel.com) and login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Select your `holykids-attendance` repository
4. Click **"Deploy"**
5. Get your live URL!

---

## Deploy to Netlify (Alternative)

1. Go to [Netlify](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select GitHub → Choose repository
4. Deploy!

---

## Test on Phone (Local Network)

### Option 1: Use Local IP

1. Get your computer's IP address:
```cmd
ipconfig
```
Look for `IPv4 Address` (e.g., `192.168.1.100`)

2. Run Next.js with host binding:
```cmd
cd "c:\Users\User\TIME ATTENDANCE"
npm run dev -- -H 0.0.0.0
```

3. On your phone, open browser and go to:
```
http://192.168.1.100:3000
```
Replace with your actual IP address

### Option 2: Use ngrok (for external testing)

1. Install ngrok from https://ngrok.com
2. Run:
```cmd
ngrok http 3000
```
3. Use the provided URL on your phone

---

## Common Issues Fixed

### Issue: "access denied" on git push
**Solution:** Use GitHub token in URL

### Issue: Phone not connecting
**Solution:** Run `npm run dev -- -H 0.0.0.0`

### Issue: Build errors
**Solution:** Run `npm run build` locally first

---

## Quick Commands Reference

```cmd
# Start development server (accessible on network)
npm run dev -- -H 0.0.0.0

# Build for production
npm run build

# Test production build locally
npm start

# Check for errors
npm run lint
```

---

## After Deployment

✅ Go to `/admin/staff` - Add staff members  
✅ Go to `/admin/reports` - Print/export records  
✅ Staff can check in at `/staff/dashboard`

---

**Created by Olushola Paul Odunuga**
