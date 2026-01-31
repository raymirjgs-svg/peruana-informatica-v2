# deploy.ps1 - Automated Deployment Script

# --- Configuration ---
$ServerIP = "200.58.98.122"
$ServerPort = "5313"
$User = "root"
$RemotePath = "/root/peruana-informatica"
$LocalPath = "$PSScriptRoot\peruana-informatica"

# Safe string construction
$DestBase = "{0}@{1}" -f $User, $ServerIP

# --- 1. Build Images ---
Write-Host "1. Building Docker Images..." -ForegroundColor Cyan

Write-Host "   Building Backend..."
docker build -t peruana-backend:latest -f "$LocalPath\backend\Dockerfile.prod" "$LocalPath\backend"
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

Write-Host "   Building Frontend..."
docker build -t peruana-frontend:latest -f "$LocalPath\frontend\Dockerfile.prod" "$LocalPath\frontend"
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

# --- 2. Save and Compress Images ---
Write-Host "2. Saving and Compressing Images..." -ForegroundColor Cyan
$ImageFile = "$PSScriptRoot\app-images.tar"
$CompressedFile = "$PSScriptRoot\app-images.tar.gz"

# Remove old files
if (Test-Path $ImageFile) { Remove-Item $ImageFile }
if (Test-Path $CompressedFile) { Remove-Item $CompressedFile }

Write-Host "   Saving images to tar..."
docker save -o $ImageFile peruana-backend:latest peruana-frontend:latest
if ($LASTEXITCODE -ne 0) { Write-Error "Docker save failed"; exit 1 }

Write-Host "   Compressing (gzip)..."
# Check if tar supports gzip (Windows 10+ standard tar usually does)
tar -czf $CompressedFile $ImageFile

if (-not (Test-Path $CompressedFile)) { 
    Write-Warning "Compression failed or skipped. Using uncompressed tar."
    $CompressedFile = $ImageFile 
}
else {
    # Remove the uncompressed tar to save space
    Remove-Item $ImageFile
}

$FileSize = (Get-Item $CompressedFile).Length / 1MB
Write-Host "   Ready to transfer: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green

# --- 3. Transfer Files ---
# FIX: Use format operator to avoid 'VariableReferenceWithDrive' error
Write-Host ("3. Transferring Files to Server ({0}:{1})..." -f $ServerIP, $ServerPort) -ForegroundColor Cyan
Write-Host "⚠️  TE PEDIRÁ LA CONTRASEÑA VARIAS VECES (una por archivo)." -ForegroundColor Yellow

# Create remote directory
ssh -p $ServerPort $DestBase "mkdir -p $RemotePath/nginx/conf.d"

# Copy Images
Write-Host "   Uploading images..."
$ScpTargetImages = "{0}:{1}/app-images.tar.gz" -f $DestBase, $RemotePath
scp -P $ServerPort $CompressedFile $ScpTargetImages

# Copy Docker Compose Production
Write-Host "   Uploading docker-compose..."
$ScpTargetCompose = "{0}:{1}/docker-compose.yml" -f $DestBase, $RemotePath
scp -P $ServerPort "$LocalPath\docker-compose.prod.yml" $ScpTargetCompose

# Copy Backend Data (Images)
if (Test-Path "$PSScriptRoot\backend_data") {
    Write-Host "   Uploading backend data (images)..."
    # Ensure remote directory exists
    ssh -p $ServerPort $DestBase "mkdir -p $RemotePath/backend_data"
    # Upload contents
    $ScpTargetBackend = "{0}:{1}/backend_data/" -f $DestBase, $RemotePath
    scp -P $ServerPort -r "$PSScriptRoot\backend_data\*" $ScpTargetBackend
}

# Copy Nginx Config
Write-Host "   Uploading Nginx config..."
$ScpTargetNginx = "{0}:{1}/nginx/conf.d/" -f $DestBase, $RemotePath
scp -P $ServerPort -r "$LocalPath\nginx\conf.d\*" $ScpTargetNginx

# --- 4. Remote Execution ---
Write-Host "4. Deploying on Server..." -ForegroundColor Cyan

$RemoteCommands = @(
    "cd $RemotePath",
    "echo '   > Extracting images...'",
    "tar -xzf app-images.tar.gz",
    "echo '   > Loading images...'",
    "docker load -i app-images.tar", 
    "rm app-images.tar app-images.tar.gz",
    "echo '   > Restarting containers...'",
    "docker compose up -d",
    "docker image prune -f" # Clean up dangling images
)

ssh -p $ServerPort $DestBase ($RemoteCommands -join " && ")

Write-Host "Deployment Complete!" -ForegroundColor Green
