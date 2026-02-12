@echo off
echo Committing CDN fix...
git add .
git commit -m "Use CDN for face-api.js models instead of local files"
git push origin main
echo Done!
pause
