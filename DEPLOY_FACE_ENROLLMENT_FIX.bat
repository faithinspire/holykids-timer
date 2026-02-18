@echo off
echo ========================================
echo DEPLOYING FACE ENROLLMENT FIX
echo ========================================
echo.

echo This fix resolves:
echo - USER NOT FOUND on enrollment page
echo - Camera not showing live preview
echo - Premature execution issues
echo - RLS errors on audit_logs
echo.

echo Step 1: Adding files to git...
git add .
echo.

echo Step 2: Committing changes...
git commit -m "fix: complete face enrollment and verification system - camera preview, staff selection, RLS"
echo.

echo Step 3: Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo CRITICAL: Run this SQL in Supabase NOW:
echo.
echo File: FIX_AUDIT_LOGS_RLS_PERMANENT.sql
echo.
echo This fixes RLS policy for audit_logs table.
echo.
echo TESTING STEPS:
echo 1. Go to Admin - Staff Management
echo 2. Click "Setup Face" on any staff
echo 3. Verify staff profile loads
echo 4. Click "Start Camera"
echo 5. See live video preview
echo 6. Click "Capture Face"
echo 7. Enter PIN and complete enrollment
echo 8. Test face clock-in
echo.
pause
