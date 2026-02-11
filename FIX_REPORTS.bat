@echo off
echo ========================================
echo HOLYKIDS - Fix Reports PDF/CSV Export
echo ========================================
echo.

echo Adding all changes to git...
git add .

echo.
echo Committing changes...
git commit -m "Fix reports to sync with localStorage and Supabase data"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Vercel will automatically deploy.
echo.
echo WHAT WAS FIXED:
echo - Reports now read from localStorage
echo - Reports also read from Supabase
echo - PDF/CSV will show all attendance records
echo - Stats will compute correctly
echo.
echo Wait 2-3 minutes then test:
echo 1. Go to Reports page
echo 2. Download CSV or PDF
echo 3. Should show all records!
echo ========================================
pause
