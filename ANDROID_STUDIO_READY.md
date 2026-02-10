# Android Studio Deployment Guide

## Complete Guide to Deploying HOLYKIDS Staff Attendance System on Android

This document provides comprehensive instructions for deploying your biometric attendance system as a native Android app using Android Studio.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation Steps](#installation-steps)
- [Android Studio Setup](#android-studio-setup)
- [Biometric Configuration](#biometric-configuration)
- [Building the APK](#building-the-apk)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Android Studio** (Latest version, preferably 2023.x or newer)
- **Java JDK** (JDK 17 or JDK 11)
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### System Requirements
- At least 8GB RAM (16GB recommended)
- 10GB free disk space
- Windows 10/11, macOS, or Linux

---

## Project Structure

```
TIME ATTENDANCE/
├── app/                          # Next.js app source
│   ├── src/main/
│   │   ├── AndroidManifest.xml   # Android manifest with permissions
│   │   ├── java/                 # Kotlin/Java source files
│   │   └── res/                  # Resources (layouts, values, etc.)
│   ├── admin/                    # Admin pages
│   ├── staff/                    # Staff pages
│   └── api/                      # API routes
├── android-deployment/           # Android deployment config
│   ├── capacitor.config.ts        # Capacitor configuration
│   └── package.json              # Android dependencies
├── lib/
│   ├── native-biometric.ts       # Biometric service (WebAuthn)
│   └── attendance.ts             # Attendance service
├── supabase/
│   └── schema.sql                # Database schema
├── package.json                  # Main dependencies
└── next.config.js                # Next.js configuration
```

---

## Installation Steps

### Step 1: Install Node.js Dependencies

```bash
# Install all dependencies including Capacitor
npm install

# Or if you have issues, install manually:
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/biometric-auth
```

### Step 2: Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in Supabase
3. Copy and execute the contents of `supabase/schema.sql`
4. This will create all necessary tables:
   - `staff` - Staff information
   - `biometric_credentials` - Biometric data
   - `attendance` - Attendance records
   - `shifts` - Work shifts
   - `leave_requests` - Leave management

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Android Studio Setup

### Step 1: Copy Capacitor Configuration

```bash
# Copy capacitor config to root
cp android-deployment/capacitor.config.ts ./
```

### Step 2: Initialize Android Project

```bash
# Add Android platform
npx cap add android
```

### Step 3: Open in Android Studio

```bash
# Open Android Studio with the project
npx cap open android
```

### Step 4: Configure Android Project

In Android Studio:

1. **Sync Project with Gradle Files**
   - Click `File > Sync Project with Gradle Files`

2. **Configure SDK**
   - Click `File > Project Structure`
   - Set `Compile SDK` to 34
   - Set `Target SDK` to 34
   - Set `Min SDK` to 23

3. **Configure Build Variants**
   - Go to `Build > Select Build Variant`
   - Select `debug` for testing or `release` for production

---

## Biometric Configuration

### AndroidManifest.xml Permissions

The app's `AndroidManifest.xml` already includes:

```xml
<!-- Biometric Permissions -->
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

<!-- Optional biometric hardware feature -->
<uses-feature android:name="android.hardware.fingerprint" android:required="false" />
```

### WebAuthn Support

The app uses **WebAuthn** for biometric authentication, which works on:
- Android Chrome (v67+)
- iOS Safari (v14+)
- Desktop browsers with fingerprint/Touch ID support

WebAuthn is the modern standard for web-based biometric authentication and works in Android WebView.

---

## Building the APK

### Debug Build (For Testing)

```bash
# Build and copy to Android
npm run build
npx cap copy android

# Run on connected device
npx cap run android
```

Or in Android Studio:
1. Connect your Android device via USB
2. Enable USB Debugging on the device
3. Click the **Run** button (green arrow)

### Release Build (For Distribution)

#### Step 1: Generate Signing Key

```bash
# Generate keystore (one-time only)
keytool -genkey -v -keystore android-deployment/keystore/attendance-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias attendance-key
```

When prompted, provide:
- Keystore password (remember this!)
- Key password
- Your name and organization details

#### Step 2: Configure Signing

Create `android/gradle.properties`:

```properties
# Release signing
RELEASE_STORE_FILE=../android-deployment/keystore/attendance-keystore.jks
RELEASE_STORE_PASSWORD=your-store-password
RELEASE_KEY_ALIAS=attendance-key
RELEASE_KEY_PASSWORD=your-key-password
```

Update `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Step 3: Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Step 4: Build App Bundle (For Google Play)

```bash
cd android
./gradlew bundleRelease
```

The AAB bundle will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Testing

### On Physical Device (Recommended)

1. **Enable Developer Options** on your Android device
   - Go to `Settings > About Phone`
   - Tap `Build Number` 7 times

2. **Enable USB Debugging**
   - Go to `Settings > Developer Options`
   - Enable `USB Debugging`

3. **Connect Device** via USB cable

4. **Test Biometric**
   - Open the app
   - Go to Staff Dashboard
   - Try fingerprint check-in/check-out

### Test Checklist

- [ ] App launches successfully
- [ ] Login works
- [ ] Staff management (add/edit/delete)
- [ ] Biometric enrollment
- [ ] Check-in with fingerprint
- [ ] Check-out with fingerprint
- [ ] Offline mode works
- [ ] Attendance history displays
- [ ] Reports are accessible

---

## Troubleshooting

### Biometric Not Working

**Problem:** Fingerprint authentication fails

**Solutions:**
1. Ensure device has fingerprint enrolled in system settings
2. Test in Chrome browser first (not WebView)
3. Check that HTTPS is being used (WebAuthn requires secure context)
4. Verify biometric permissions in AndroidManifest.xml

```bash
# Check if device supports biometric
adb shell dumpsys biometric
```

### Build Errors

**Problem:** Gradle build fails

**Solutions:**
1. Update Android Studio and SDK Tools
2. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```
3. Check Java version:
   ```bash
   java -version
   ```
   Should be JDK 17 or JDK 11

### App Crashes on Startup

**Solutions:**
1. Check Logcat in Android Studio for errors
2. Verify Supabase credentials are correct
3. Ensure all permissions are granted

### APK Not Installing

**Problem:** "App not installed" error

**Solutions:**
1. Enable "Install from unknown sources" on device
2. Uninstall existing version first
3. Check if signing certificate matches

---

## Deployment to Google Play Store

### Step 1: Prepare Store Listing

- **App Name:** HOLYKIDS Staff Attendance
- **Short Description:** Biometric attendance system for schools
- **Full Description:** Include features:
  - Fingerprint authentication
  - Real-time attendance tracking
  - Staff management
  - Reports and analytics

### Step 2: Upload AAB Bundle

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload `app-release.aab`
4. Fill in store listing
5. Set content rating (likely "Everyone")
6. Review and publish

### Step 3: Production Release

After testing thoroughly:
1. Increment version code in `android/app/build.gradle`
2. Build new release bundle
3. Upload to Play Console
4. Roll out to production

---

## Support

For issues or questions:
- Check the main README.md
- Review the schema in supabase/schema.sql
- Check browser console for JavaScript errors
- Use Logcat in Android Studio for native errors

---

**Created by Olushola Paul Odunuga**
