@echo off
echo ========================================
echo DEPLOYING USER NOT FOUND FIX
echo ========================================
echo.

echo Step 1: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo.

echo Step 2: Adding files to git...
git add .
echo.

echo Step 3: Committing changes...
git commit -m "fix: permanent fix for USER NOT FOUND - canonical ID rule enforced"
echo.

echo Step 4: Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Go to Supabase SQL Editor
echo 2. Run: FIX_USER_NOT_FOUND_PERMANENT.sql
echo 3. Verify staff.user_id column exists
echo 4. Test face enrollment
echo.
echo Your code is now on GitHub and will auto-deploy!
echo.
pause
