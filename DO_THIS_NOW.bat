@echo off
echo ========================================
echo FINAL FIX - UPDATING ENROLLMENT PAGE
echo ========================================
echo.

cd /d "%~dp0"

echo Fixing enrollment page to use CDN...
powershell -ExecutionPolicy Bypass -Command "$content = Get-Content 'app\staff\face-enrollment\page.tsx' -Raw; $content = $content -replace \"const MODEL_URL = '/models'\", \"const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'\"; Set-Content 'app\staff\face-enrollment\page.tsx' -Value $content"

echo.
echo Adding changes...
git add app\staff\face-enrollment\page.tsx

echo.
echo Committing...
git commit -m "Fix enrollment page to use CDN for models"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Wait 2-5 minutes for Vercel to deploy.
echo Then test at: https://your-app.vercel.app/face-clock-in
echo.
echo Models will load from CDN - face recognition will work!
echo.
pause
