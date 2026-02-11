@echo off
echo ========================================
echo FACE RECOGNITION MODELS DOWNLOADER
echo ========================================
echo.
echo This will download AI model files needed for facial recognition
echo Total size: ~10MB
echo.
pause

powershell -ExecutionPolicy Bypass -File download-models.ps1

pause
