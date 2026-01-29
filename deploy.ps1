# deploy.ps1 - Automated Deployment Script

# --- Configuration ---
$ServerIP = "149.50.144.210"
$User = "root"
$RemotePath = "/root/peruana-informatica"
$LocalPath = "$PSScriptRoot\peruana-informatica"

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
# If tar fails or doesn't produce the file, fall back or error out. 
# Assuming standard Windows tar.exe works.

if (-not (Test-Path $CompressedFile)) { 
    Write-Warning "Compression failed or skipped. Using uncompressed tar."
    $CompressedFile = $ImageFile 
} else {
    # Remove the uncompressed tar to save space
    Remove-Item $ImageFile
}

$FileSize = (Get-Item $CompressedFile).Length / 1MB
Write-Host "   Ready to transfer: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green

# --- 3. Transfer Files ---
Write-Host "3. Transferring Files to Server ($ServerIP)..." -ForegroundColor Cyan

# Create remote directory
ssh $User@$ServerIP "mkdir -p $RemotePath/nginx/conf.d"

# Copy Images
Write-Host "   Uploading images..."
scp $CompressedFile "$User@$ServerIP`:$RemotePath/app-images.tar.gz"

# Copy Docker Compose Production
Write-Host "   Uploading docker-compose..."
scp "$LocalPath\docker-compose.prod.yml" "$User@$ServerIP`:$RemotePath/docker-compose.yml"

# Copy Nginx Config
Write-Host "   Uploading Nginx config..."
scp -r "$LocalPath\nginx\conf.d\*" "$User@$ServerIP`:$RemotePath/nginx/conf.d/"

# Copy .env (Optional - usually better to manage secrets on server, but for sync setup:)
# scp "$LocalPath\.env" "$User@$ServerIP`:$RemotePath/.env"
# Uncomment above if you want to overwrite server .env

# --- 4. Remote Execution ---
Write-Host "4. Deploying on Server..." -ForegroundColor Cyan

$RemoteCommands = @(
    "cd $RemotePath",
    "echo '   > Extracting images...'",
    "tar -xzf app-images.tar.gz",  # Or gunzip if tar doesn't handle compression automatically, but tar -xzf is standard
    "echo '   > Loading images...'",
    "docker load -i app-images.tar", 
    "rm app-images.tar app-images.tar.gz",
    "echo '   > Restarting containers...'",
    "docker compose up -d",
    "docker image prune -f" # Clean up dangling images
)

ssh $User@$ServerIP ($RemoteCommands -join " && ")

Write-Host "Deployment Complete!" -ForegroundColor Green
