# 👆 Biometric Fingerprint Guide

## How It Works

### Step 1: Register Staff Member
1. Go to Staff Management
2. Click "Add Staff"
3. Fill in staff details (name, department, role)
4. System auto-generates a 4-digit PIN
5. Staff is saved

### Step 2: Enroll Fingerprint
1. In the staff list, click "Setup" button under Biometric column
2. Staff member places finger on phone's fingerprint sensor
3. Phone prompts: "Use your fingerprint to continue"
4. Staff scans their fingerprint
5. System saves the fingerprint credential
6. Status changes to "✅ Enrolled"

### Step 3: Clock In with Fingerprint
1. Go to Clock In page (big green button on dashboard)
2. Click "Scan Fingerprint" button
3. Staff places finger on sensor
4. System recognizes fingerprint
5. Shows success screen with:
   - Staff name
   - Department
   - Clock-in time
   - Date
6. Auto-refreshes after 3 seconds for next person

## What You'll See

### During Enrollment
- **First time:** Phone may ask to set up fingerprint if not already configured
- **Prompt:** "Use your fingerprint to continue"
- **Action:** Place finger on sensor (usually on back or side of phone)
- **Result:** "✅ Fingerprint enrolled successfully!"

### During Clock-In
- **Prompt:** "Use your fingerprint to continue"
- **Action:** Place finger on sensor
- **Result:** Success screen with staff details
- **Auto-refresh:** Page resets after 3 seconds

## Important Notes

### Device Requirements
- ✅ Phone must have fingerprint sensor
- ✅ Fingerprint must be set up in phone settings
- ✅ Must use HTTPS (Vercel provides this automatically)
- ✅ Browser must support Web Authentication API (Chrome, Safari, Edge)

### Security
- 🔒 Fingerprint data NEVER leaves the device
- 🔒 Only encrypted credentials are stored
- 🔒 Each staff has unique biometric credential
- 🔒 Cannot be copied or transferred

### Troubleshooting

**"Biometric authentication not supported"**
- Device doesn't have fingerprint sensor
- Use PIN entry instead

**"No fingerprint sensor detected"**
- Fingerprint not set up in phone settings
- Go to phone Settings > Security > Fingerprint

**"Fingerprint not recognized"**
- Staff hasn't enrolled yet
- Click "Setup" in Staff Management first

**Asking for "Passkey"**
- This is normal! Passkey = Fingerprint on phones
- Just use your fingerprint when prompted
- Don't need USB key or external device

## The Flow

```
1. REGISTER STAFF
   ↓
2. ENROLL FINGERPRINT (one-time setup)
   ↓
3. CLOCK IN WITH FINGERPRINT (daily use)
   ↓
4. SUCCESS! (auto-refresh for next person)
```

## Why "Passkey"?

Modern browsers call fingerprints "passkeys" because they can be:
- Fingerprint (most common on phones)
- Face ID (iPhone)
- PIN/Pattern (Android)
- Security key (USB - not needed for this app)

**For your app:** Staff will use their phone's fingerprint sensor. No USB keys needed!

## Testing Steps

### 1. Test Enrollment
```
1. Add a test staff member
2. Click "Setup" under Biometric
3. Use YOUR fingerprint to enroll
4. Should see "✅ Enrolled"
```

### 2. Test Clock-In
```
1. Go to Clock In page
2. Click "Scan Fingerprint"
3. Use same fingerprint
4. Should see success screen with staff details
5. Wait 3 seconds - page resets
```

### 3. Test Multiple Staff
```
1. Add another staff member
2. Enroll with DIFFERENT finger (or different person)
3. Both can clock in with their own fingerprints
4. System recognizes each person correctly
```

## Fallback Option

If fingerprint doesn't work:
- Click "Use PIN Instead" link
- Enter 4-digit PIN
- Clock in successfully

## Best Practices

1. **Enroll all staff first** before daily use
2. **Test with 2-3 staff** to ensure it works
3. **Keep PIN as backup** in case fingerprint fails
4. **Use on same device** where fingerprint was enrolled
5. **HTTPS required** - Vercel provides this automatically

---

## Quick Reference

| Action | Location | Button |
|--------|----------|--------|
| Add Staff | Staff Management | + Add Staff |
| Enroll Fingerprint | Staff Management | Setup (under Biometric) |
| Clock In | Dashboard | 🟢 Clock In/Out |
| Use PIN | Clock In page | Use PIN Instead |

---

**Status:** ✅ Ready to use  
**Device:** Any phone with fingerprint sensor  
**Security:** 🔒 Fingerprint never leaves device  
**Fallback:** PIN entry available
