@echo off
echo ========================================
echo HOLYKIDS - Deploying Changes to Vercel
echo ========================================
echo.

echo Adding all changes to git...
git add .

echo.
echo Committing changes...
git commit -m "Fix biometric enrollment - proper fingerprint registration and authentication"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Vercel will automatically deploy.
echo Check your Vercel dashboard for status.
echo ========================================
pause
