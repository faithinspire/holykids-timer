@echo off
git add .
git commit -m "add diagnostic endpoint to check database connection"
git push origin main
echo.
echo ========================================
echo DEPLOYED! Now check:
echo https://YOUR-SITE-URL/api/diagnostic
echo ========================================
pause
