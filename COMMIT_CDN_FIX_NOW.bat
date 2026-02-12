@echo off
echo.
echo ========================================
echo COMMITTING CDN FIX
echo ========================================
echo.

cd /d "%~dp0"

echo Adding files...
git add app/face-clock-in/page.tsx
git add USE_CDN_FOR_MODELS.md
git add MANUAL_FIX_REQUIRED_NOW.txt
git add COMMIT_CDN_FIX_NOW.bat

echo.
echo Committing...
git commit -m "Use CDN for face-api.js models to fix tensor shape error"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Next: Wait for Vercel to deploy, then test!
echo.
pause
