@echo off
echo ========================================
echo HOLYKIDS - FACIAL RECOGNITION DEPLOYMENT
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
echo.

echo Step 2: Adding all changes to git...
git add .
echo.

echo Step 3: Committing changes...
git commit -m "Implement facial recognition system with PIN fallback - Remove fingerprint completely"
echo.

echo Step 4: Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. DOWNLOAD FACE RECOGNITION MODELS
echo    - Read DOWNLOAD_MODELS.md for instructions
echo    - Download 8 model files from GitHub
echo    - Place in public/models/ folder
echo.
echo 2. RUN DATABASE MIGRATION
echo    - Go to Supabase Dashboard
echo    - Open SQL Editor
echo    - Copy/paste FACIAL_RECOGNITION_SCHEMA.sql
echo    - Click "Run"
echo.
echo 3. WAIT FOR VERCEL DEPLOYMENT
echo    - Vercel will auto-deploy in 2-3 minutes
echo    - Check deployment status in Vercel dashboard
echo.
echo 4. TEST THE SYSTEM
echo    - Go to Staff Management
echo    - Add a staff member
echo    - Click "Setup Face" to enroll
echo    - Test face clock-in
echo    - Test PIN clock-in fallback
echo.
echo ========================================
echo WHAT WAS CHANGED:
echo ========================================
echo - Removed ALL fingerprint/biometric code
echo - Added facial recognition with face-api.js
echo - Added PIN fallback system
echo - Updated database schema
echo - Created new enrollment and clock-in pages
echo - Added security features (hashing, logging)
echo.
echo ========================================
pause
