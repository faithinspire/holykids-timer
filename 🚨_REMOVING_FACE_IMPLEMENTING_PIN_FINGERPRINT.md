# 🚨 REMOVING FACIAL RECOGNITION - IMPLEMENTING PIN + FINGERPRINT

## Decision: FACIAL RECOGNITION REMOVED

Authentication will use:
1. PIN (primary) - validated against database
2. WebAuthn Fingerprint (secondary) - device biometric confirmation

NO camera, NO face-api, NO image capture.

## Implementation Plan

### 1. Remove Face Recognition Files
- Delete `/app/face-clock-in`
- Delete `/app/staff/face-enrollment`
- Delete `/app/api/face/*`
- Remove face-api references
- Remove camera code

### 2. Update Database Schema
```sql
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS biometric_credential_id TEXT;

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pin+fingerprint';
```

### 3. Implement PIN + Fingerprint Clock-In
- Staff enters staff_number
- Staff enters PIN
- Validate PIN against database (hashed)
- Click "Verify Fingerprint"
- Browser shows native biometric prompt
- On success → record attendance

### 4. Security
- PIN stored as hash (SHA-256)
- Fingerprint = WebAuthn credential ID only
- No raw biometric data stored
- RLS policies allow attendance inserts

### 5. UI Flow
```
Clock-In Page:
├── Staff Number Input
├── PIN Input (password field)
├── "Verify with Fingerprint" Button
└── Success/Error Messages
```

## Starting Implementation...
