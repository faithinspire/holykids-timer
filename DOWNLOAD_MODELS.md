# 📥 DOWNLOAD FACE RECOGNITION MODELS

## IMPORTANT: Models Required for Facial Recognition

The facial recognition system needs model files to work. These files are NOT included in the repository due to size.

## OPTION 1: Download Manually (Recommended)

### Step 1: Create Models Folder
Create this folder in your project:
```
public/models/
```

### Step 2: Download Model Files
Go to this GitHub repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Download these 8 files:

**Tiny Face Detector:**
1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1`

**Face Landmarks:**
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1`

**Face Recognition:**
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1`

**Face Expression (optional but recommended):**
7. `face_expression_model-weights_manifest.json`
8. `face_expression_model-shard1`

### Step 3: Place Files
Put all 8 files in the `public/models/` folder.

Your folder structure should look like:
```
public/
  models/
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_landmark_68_model-shard1
    face_recognition_model-weights_manifest.json
    face_recognition_model-shard1
    face_expression_model-weights_manifest.json
    face_expression_model-shard1
```

## OPTION 2: Use CDN (Alternative)

If you don't want to download files, you can modify the code to load from CDN.

In `lib/faceRecognition.ts`, change line 12:
```typescript
// FROM:
const MODEL_URL = '/models'

// TO:
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
```

**Note:** CDN loading is slower and requires internet connection.

## OPTION 3: Download via Command (Advanced)

If you have `curl` or `wget` installed:

### Windows (PowerShell):
```powershell
# Create models folder
New-Item -ItemType Directory -Force -Path public\models

# Download files
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$files = @(
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_expression_model-weights_manifest.json",
  "face_expression_model-shard1"
)

foreach ($file in $files) {
  Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile "public\models\$file"
  Write-Host "Downloaded $file"
}
```

### Linux/Mac:
```bash
# Create models folder
mkdir -p public/models

# Download files
cd public/models
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
cd ../..
```

## ✅ VERIFY INSTALLATION

After downloading, verify the files exist:

### Windows:
```cmd
dir public\models
```

You should see 8 files listed.

### Linux/Mac:
```bash
ls -la public/models
```

## 📦 FILE SIZES

Total size: ~10MB
- tiny_face_detector: ~1.2MB
- face_landmark_68: ~350KB
- face_recognition: ~6.2MB
- face_expression: ~300KB

## 🚀 AFTER DOWNLOADING

1. Verify all 8 files are in `public/models/`
2. Run `npm install` to install face-api.js
3. Run `npm run dev` to test locally
4. Visit face enrollment page to test camera
5. If models load successfully, you'll see "Models loaded!" toast

## ⚠️ IMPORTANT FOR DEPLOYMENT

When deploying to Vercel:
- The `public/models/` folder will be included in deployment
- Models will be served as static files
- First load may take 2-3 seconds to download models
- Models are cached in browser after first load

## 🐛 TROUBLESHOOTING

### "Failed to load models"
- Check all 8 files are in `public/models/`
- Check file names match exactly (case-sensitive)
- Try using CDN option instead

### "404 Not Found" for model files
- Restart dev server after adding files
- Clear browser cache
- Check file permissions

### Models load slowly
- Normal on first load (~10MB download)
- Subsequent loads use browser cache
- Consider using CDN for faster initial load

---

**Ready?** Download the models and let's get facial recognition working! 🎉
