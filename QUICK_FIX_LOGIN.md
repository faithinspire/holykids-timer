# 🚀 Quick Fix - Login & Android Deployment

## Part 1: Fix Login Issue

### Problem: Can't Log In
The login fails because the Supabase database tables haven't been set up yet.

### Solution: Set Up Database (5 Minutes)

#### Step 1: Run Database Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `mmluzuxcoqyrtenstxq`
3. Click **SQL Editor** → **New Query**
4. Copy and paste the entire content from [`supabase/final-setup.sql`](supabase/final-setup.sql)
5. Click **Run** (should show "Success")

**Note:** Use `final-setup.sql` - it's safe to run multiple times!

#### Step 2: Create Admin User
1. In Supabase Dashboard, click **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - **Email**: `admin@timeattendance.edu`
   - **Password**: `Admin123!@#`
   - **Email Confirm**: ✅ Check this box
4. Click **Create User**
5. **Copy the User ID** (shown after creation)

#### Step 3: Link Admin User
1. Go back to **SQL Editor**
2. Create new query and run:
   ```sql
   UPDATE staff 
   SET id = 'YOUR_COPIED_USER_ID' 
   WHERE staff_id = 'ADMIN001';
   ```
   (Replace `YOUR_COPIED_USER_ID` with the ID you copied)

#### Step 4: Test Login
1. Run the app: `npm run dev`
2. Go to `http://localhost:3000/test-connection`
3. Click **Refresh Status** - should show all green
4. Try logging in at `http://localhost:3000/auth/login`
   - Email: `admin@timeattendance.edu`
   - Password: `Admin123!@#`

---

## Part 2: Android Studio Deployment

### Prerequisites
- ✅ Android Studio installed
- ✅ Java JDK 11+ installed
- ✅ Node.js 18+ installed

### Step 1: Install Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/geolocation @capacitor/local-notifications @capacitor/push-notifications @capacitor/status-bar @capacitor/keyboard @capacitor/splash-screen
```

### Step 2: Build for Production
```bash
npm run build
```

### Step 3: Add Android Platform
```bash
# Copy capacitor config to root
cp android-deployment/capacitor.config.ts ./

# Add Android platform
npx cap add android
```

### Step 4: Build and Sync
```bash
npm run build
npx cap copy android
npx cap sync android
```

### Step 5: Open in Android Studio
```bash
npx cap open android
```

### Step 6: Generate Signing Key (for release)
```bash
keytool -genkey -v -keystore android-deployment/keystore/attendance-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias attendance-key
```

### Step 7: Build Release APK
In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Select keystore file
4. Click Build

### APK Location
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Success Checklist

### Login Working
- [ ] Database schema run successfully (use `supabase/final-setup.sql`)
- [ ] Admin user created in Authentication
- [ ] User ID linked to staff table
- [ ] Can login at /auth/login

### Android Build Ready
- [ ] Capacitor dependencies installed
- [ ] Android platform added
- [ ] Build completes without errors
- [ ] APK/AAB generated

---

## 🆘 Troubleshooting

### Login Issues
| Error | Solution |
|-------|----------|
| "Table not found" | Run `supabase/final-setup.sql` in Supabase |
| "Invalid credentials" | Create admin user in Authentication |
| "User not found" | Link User ID to staff table |
| "permission denied" | Use `supabase/final-setup.sql` (safe version) |

### Android Build Issues
| Error | Solution |
|-------|----------|
| "Java not found" | Install JDK 11+ and set JAVA_HOME |
| "Android SDK not found" | Install Android SDK in Android Studio |
| "Capacitor not initialized" | Run `npx cap add android` |

---

## 📞 Need Help?
1. Check [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md) for current system status
2. Check browser console for error messages
3. Check Supabase Dashboard for database errors
