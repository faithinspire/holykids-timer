@echo off
echo ========================================
echo DEPLOYING SERVER-SIDE FACE RECOGNITION
echo ========================================
echo.
echo This will:
echo - Remove all client-side ML libraries
echo - Deploy server-side face detection
echo - Simplify browser code (camera only)
echo.
pause

git add -A
git commit -m "FINAL: Server-side face recognition, remove client-side ML"
git push origin main

echo.
echo ========================================
echo DEPLOYED!
echo ========================================
echo.
echo Wait 2-5 minutes for Vercel to deploy.
echo.
echo Then test:
echo 1. Face enrollment: /staff/face-enrollment
echo 2. Face clock-in: /face-clock-in
echo 3. PIN fallback: /pin-clock-in
echo.
echo NOTE: Face recognition uses mock data for now.
echo See SERVER_SIDE_FACE_RECOGNITION.md for integration guide.
echo.
pause
