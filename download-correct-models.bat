@echo off
echo Downloading correct face-api.js model files...
echo.

cd public\models

echo Downloading face_recognition_model-shard1...
curl -L -o face_recognition_model-shard1 https://github.com/justadudewhohacks/face-api.js-models/raw/master/face_recognition_model-shard1

echo Downloading face_recognition_model-shard2...
curl -L -o face_recognition_model-shard2 https://github.com/justadudewhohacks/face-api.js-models/raw/master/face_recognition_model-shard2

echo Downloading face_recognition_model-weights_manifest.json...
curl -L -o face_recognition_model-weights_manifest.json https://github.com/justadudewhohacks/face-api.js-models/raw/master/face_recognition_model-weights_manifest.json

cd ..\..

echo.
echo Done! Model files downloaded.
echo.
echo Now run:
echo   git add public/models/
echo   git commit -m "Update face recognition model files"
echo   git push origin main
pause
