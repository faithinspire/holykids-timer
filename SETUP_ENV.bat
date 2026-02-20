@echo off
echo ========================================
echo HOLYKIDS ENVIRONMENT SETUP
echo ========================================
echo.

if exist .env.local (
    echo ⚠️  .env.local already exists
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :create
) else (
    goto :create
)

:create
echo.
echo Creating .env.local from template...
copy .env.local.example .env.local
echo.
echo ✅ .env.local created!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Open .env.local in a text editor
echo.
echo 2. Go to Supabase Dashboard:
echo    https://supabase.com/dashboard
echo.
echo 3. Select your project
echo.
echo 4. Go to Settings → API
echo.
echo 5. Copy these values to .env.local:
echo    - Project URL → NEXT_PUBLIC_SUPABASE_URL
echo    - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
echo    - service_role key → SUPABASE_SERVICE_ROLE_KEY
echo.
echo 6. Save .env.local
echo.
echo 7. Restart your development server:
echo    npm run dev
echo.
echo ========================================
echo.

:end
pause
