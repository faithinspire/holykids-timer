@echo off
echo ========================================
echo HOLYKIDS - FINAL FIX - Supabase Integration
echo ========================================
echo.

echo Adding all changes to git...
git add .

echo.
echo Committing changes...
git commit -m "FINAL FIX: Biometric enrollment and clock-in now use Supabase database"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Vercel will automatically deploy.
echo.
echo WHAT WAS FIXED:
echo - Enrollment now saves to Supabase database
echo - Clock-in now reads from Supabase database
echo - Both systems are now synced!
echo.
echo Wait 2-3 minutes then test:
echo 1. Enroll fingerprint
echo 2. Go to clock-in
echo 3. It will find enrolled staff!
echo ========================================
pause
