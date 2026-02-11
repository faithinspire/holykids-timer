# Face Recognition Models Downloader
# This script downloads the AI model files needed for facial recognition

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DOWNLOADING FACE RECOGNITION MODELS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will download 8 AI model files (~10MB total)" -ForegroundColor Yellow
Write-Host "These files are required for facial recognition to work" -ForegroundColor Yellow
Write-Host ""

# Create models folder
Write-Host "Creating public/models folder..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "public\models" | Out-Null

# Base URL for model files
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# List of files to download
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

Write-Host ""
Write-Host "Downloading model files..." -ForegroundColor Green
Write-Host ""

$count = 0
foreach ($file in $files) {
    $count++
    Write-Host "[$count/8] Downloading $file..." -ForegroundColor Cyan
    
    try {
        Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile "public\models\$file" -ErrorAction Stop
        Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to download: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DOWNLOAD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Model files saved to: public\models\" -ForegroundColor Yellow
Write-Host ""
Write-Host "Verifying files..." -ForegroundColor Green
$downloadedFiles = Get-ChildItem -Path "public\models" -File
Write-Host "Found $($downloadedFiles.Count) files:" -ForegroundColor Cyan
foreach ($file in $downloadedFiles) {
    Write-Host "  ✓ $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Deploy your app" -ForegroundColor White
Write-Host "3. Test facial recognition!" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
