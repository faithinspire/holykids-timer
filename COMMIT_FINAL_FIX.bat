@echo off
echo Committing server-side face recognition...
git add -A
git commit -m "Server-side face recognition - remove client ML"
git push origin main
echo Done! Wait for Vercel to deploy.
pause
