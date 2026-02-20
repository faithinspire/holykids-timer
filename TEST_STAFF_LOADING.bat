@echo off
echo ========================================
echo TESTING STAFF LOADING
echo ========================================
echo.
echo Opening test URLs in browser...
echo.
echo 1. Testing Staff API...
start "" "https://holykids-timer-1.onrender.com/api/staff"
timeout /t 2 /nobreak >nul

echo 2. Testing Diagnostic API...
start "" "https://holykids-timer-1.onrender.com/api/diagnostic"
timeout /t 2 /nobreak >nul

echo 3. Opening Test Page...
start "" "https://holykids-timer-1.onrender.com/test-staff-api"

echo.
echo ========================================
echo CHECK THE BROWSER TABS
echo ========================================
echo.
echo Look for:
echo - Staff API: Should show array of staff with "id" field
echo - Diagnostic: Should show "connected: true" and staff count
echo - Test Page: Click the test buttons
echo.
echo COPY THE RESULTS AND REPORT BACK!
echo.
pause
