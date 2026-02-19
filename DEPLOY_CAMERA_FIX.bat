@echo off
echo ========================================
echo DEPLOYING CAMERA CAPTURE FIX
echo ========================================
echo.

git add .
git commit -m "fix: improve camera capture with better error handling and video ready checks"
git push origin main

echo.
echo ========================================
echo DEPLOYED!
echo ========================================
echo.
echo Changes:
echo - Added video readyState check before capture
echo - Added video dimensions validation
echo - Added canvas context validation
echo - Better error messages
echo - Wait for video metadata before playing
echo.
echo Test by:
echo 1. Clear browser cache (Ctrl+Shift+R)
echo 2. Go to face enrollment
echo 3. Click Start Camera
echo 4. Wait for "Camera ready!" message
echo 5. Click "Capture Face"
echo 6. Check browser console (F12) for [CAPTURE] logs
echo.
pause
