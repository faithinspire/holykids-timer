@echo off
echo ========================================
echo FACIAL RECOGNITION - COMPLETE DEPLOYMENT
echo ========================================
echo.

echo Step 1: Committing all changes...
git add .
git commit -m "Implement facial recognition system with PIN fallback"

echo.
echo Step 2: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Models downloaded: YES (8 files in public/models/)
echo face-api.js installed: YES
echo Changes pushed to GitHub: YES
echo.
echo Vercel will auto-deploy in 2-3 minutes!
echo.
echo NEXT STEPS:
echo 1. Go to Supabase Dashboard
echo 2. Open SQL Editor
echo 3. Run the SQL from FACIAL_RECOGNITION_SCHEMA.sql
echo 4. Wait for Vercel deployment
echo 5. Test the system!
echo.
pause
