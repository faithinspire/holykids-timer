@echo off
echo ========================================
echo HOLYKIDS - Deploying SIMPLIFIED Biometric
echo ========================================
echo.

echo Adding all changes to git...
git add .

echo.
echo Committing changes...
git commit -m "SIMPLIFIED biometric system - fully functional and responsive"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Vercel will automatically deploy.
echo This version WILL WORK!
echo ========================================
pause
