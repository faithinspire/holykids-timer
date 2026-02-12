@echo off
echo ================================================================================
echo FIXING BUILD ERROR - CLEANING NODE_MODULES
echo ================================================================================
echo.
echo This will delete node_modules and reinstall all dependencies...
echo This may take 3-5 minutes.
echo.

cd /d "%~dp0"

echo Step 1: Deleting node_modules folder...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ node_modules deleted
) else (
    echo ✓ node_modules already deleted
)

echo.
echo Step 2: Deleting package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo ✓ package-lock.json deleted
) else (
    echo ✓ package-lock.json already deleted
)

echo.
echo Step 3: Installing fresh dependencies...
echo This will take a few minutes...
npm install

echo.
echo Step 4: Testing build...
npm run build

echo.
echo ================================================================================
echo DONE!
echo ================================================================================
echo.
echo If build succeeded, commit and push:
echo   git add -A
echo   git commit -m "Fix build error - clean install"
echo   git push origin main
echo.
echo Press any key to exit...
pause >nul
