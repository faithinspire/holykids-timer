@echo off
echo ========================================
echo ENVIRONMENT VARIABLES CHECK
echo ========================================
echo.

echo Checking .env.local file...
if exist .env.local (
    echo ✅ .env.local file exists
    echo.
    echo Contents:
    type .env.local
) else (
    echo ❌ .env.local file NOT FOUND
    echo.
    echo Create .env.local with:
    echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
)

echo.
echo ========================================
echo.
echo To fix missing environment variables:
echo 1. Copy .env.local.example to .env.local
echo 2. Fill in your Supabase credentials
echo 3. Restart the development server
echo.
echo For Render deployment:
echo 1. Go to Render dashboard
echo 2. Click your service
echo 3. Go to Environment tab
echo 4. Add the same variables
echo.
pause
