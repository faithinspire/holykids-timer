@echo off
echo ========================================
echo RESTARTING LOCAL DEV SERVER
echo ========================================
echo.

echo Step 1: Deleting .next cache folder...
if exist ".next" (
    rmdir /s /q .next
    echo .next folder deleted
) else (
    echo .next folder not found (already clean)
)
echo.

echo Step 2: Starting dev server...
echo.
echo IMPORTANT: This will start the server.
echo Press Ctrl+C to stop it when done testing.
echo.
pause

npm run dev
