@echo off
echo ================================================================================
echo FORCING VERCEL DEPLOYMENT
echo ================================================================================
echo.
echo This will create an empty commit to trigger Vercel to rebuild...
echo.

cd /d "%~dp0"

echo Step 1: Creating empty commit...
git commit --allow-empty -m "Force Vercel deployment - server-side face recognition"

echo.
echo Step 2: Pushing to GitHub...
git push origin main

echo.
echo ================================================================================
echo DONE!
echo ================================================================================
echo.
echo Vercel should start deploying in 10-30 seconds.
echo.
echo Check deployment status at: https://vercel.com/dashboard
echo.
echo Press any key to exit...
pause >nul
