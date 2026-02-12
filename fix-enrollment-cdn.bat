@echo off
powershell -ExecutionPolicy Bypass -Command "(Get-Content 'app\staff\face-enrollment\page.tsx') -replace \"const MODEL_URL = '/models'\", \"const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'\" | Set-Content 'app\staff\face-enrollment\page.tsx'"
echo Fixed enrollment page to use CDN
