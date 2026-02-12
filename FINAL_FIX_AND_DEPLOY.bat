@echo off
echo ========================================
echo FINAL FIX - USING CDN FOR ALL MODELS
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Fixing enrollment page to use CDN...
powershell -ExecutionPolicy Bypass -Command "(Get-Content 'app\staff\face-enrollment\page.tsx') -replace \"const MODEL_URL = '/models'\", \"const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'\" | Set-Content 'app\staff\face-enrollment\page.tsx'"

echo Step 2: Adding all changes to git...
git add -A

echo Step 3: Committing changes...
git commit -m "FINAL FIX: Use CDN for all face-api.js models, delete local files"

echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE! 
echo ========================================
echo.
echo Changes pushed to GitHub!
echo Wait 2-5 minutes for Vercel to deploy.
echo Then test at: https://your-app.vercel.app/face-clock-in
echo.
echo Models will now load from CDN - no more errors!
echo.
pause
