@echo off
echo ╔════════════════════════════════════════╗
echo ║   CHECKING AND FIXING BIOMETRIC        ║
echo ╚════════════════════════════════════════╝
echo.

echo Step 1: Checking if changes are committed...
git status

echo.
echo ════════════════════════════════════════
echo.
echo Step 2: Adding all changes...
git add .

echo.
echo Step 3: Committing changes...
git commit -m "FIX: Simplified biometric system - fully functional"

echo.
echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo ╔════════════════════════════════════════╗
echo ║   DONE! Wait 2-3 minutes for Vercel   ║
echo ║   to build and deploy.                 ║
echo ╚════════════════════════════════════════╝
echo.
echo After deployment:
echo 1. Refresh your app
echo 2. Go to Staff Management
echo 3. Delete old staff and add new one
echo 4. Enroll fingerprint
echo 5. Try clock-in
echo.
pause
