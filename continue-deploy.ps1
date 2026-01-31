# continue-deploy.ps1 - Upload and Deploy ONLY (No Build)
# Use this when you already have 'app-images.tar.gz' ready.

# --- Configuration ---
$ServerIP = "200.58.98.122"
$ServerPort = "5313"
$User = "root"
$RemotePath = "/root/peruana-informatica"
$LocalPath = "$PSScriptRoot\peruana-informatica"
$CompressedFile = "$PSScriptRoot\app-images.tar.gz"
$DestBase = "{0}@{1}" -f $User, $ServerIP

# --- Validation ---
if (-not (Test-Path $CompressedFile)) {
    Write-Error "❌ Error: No se encontró 'app-images.tar.gz'. Ejecuta primero 'deploy.ps1' para construir el proyecto."
    exit 1
}

Write-Host "🚀 Iniciando proceso de SUBIDA y DESPLIEGUE (Saltando construcción)..." -ForegroundColor Cyan
Write-Host "📦 Archivo a subir: $CompressedFile"
# FIX: Use format operator
Write-Host ("🎯 Destino: {0}:{1}" -f $ServerIP, $ServerPort)
Write-Host ""
Write-Host "⚠️  TE PEDIRÁ LA CONTRASEÑA VARIAS VECES." -ForegroundColor Yellow

# --- 1. Transfer Files ---
Write-Host "1. Subiendo archivos al servidor..." -ForegroundColor Cyan

# Create remote directory
Write-Host "   Creando carpetas remotas..."
ssh -p $ServerPort $DestBase "mkdir -p $RemotePath/nginx/conf.d"

# Copy Images
Write-Host "   Subiendo imágenes Docker (esto puede tardar)..."
$ScpTargetImages = "{0}:{1}/app-images.tar.gz" -f $DestBase, $RemotePath
scp -P $ServerPort $CompressedFile $ScpTargetImages

# Copy Backend Data (Images/Uploads)
if (Test-Path "$PSScriptRoot\backend_data") {
    Write-Host "   Subiendo datos del backend (imágenes de productos)..."
    ssh -p $ServerPort $DestBase "mkdir -p $RemotePath/backend_data"
    $ScpTargetBackend = "{0}:{1}/backend_data/" -f $DestBase, $RemotePath
    scp -P $ServerPort -r "$PSScriptRoot\backend_data\*" $ScpTargetBackend
}

# Copy Docker Compose Production
Write-Host "   Subiendo configuración..."
$ScpTargetCompose = "{0}:{1}/docker-compose.yml" -f $DestBase, $RemotePath
scp -P $ServerPort "$LocalPath\docker-compose.prod.yml" $ScpTargetCompose

# Copy Nginx Config
$ScpTargetNginx = "{0}:{1}/nginx/conf.d/" -f $DestBase, $RemotePath
scp -P $ServerPort -r "$LocalPath\nginx\conf.d\*" $ScpTargetNginx

# --- 2. Remote Execution ---
Write-Host "2. Desplegando en el servidor..." -ForegroundColor Cyan

$RemoteCommands = @(
    "cd $RemotePath",
    "echo '   > Descomprimiendo imágenes...'",
    "tar -xzf app-images.tar.gz",
    "echo '   > Cargando imágenes en Docker...'",
    "docker load -i app-images.tar", 
    "rm app-images.tar app-images.tar.gz",
    "echo '   > Reiniciando contenedores...'",
    "docker compose up -d",
    "docker image prune -f"
)

ssh -p $ServerPort $DestBase ($RemoteCommands -join " && ")

Write-Host ""
Write-Host "✅ ¡Despliegue Completado con Éxito!" -ForegroundColor Green
Write-Host "Web: http://$ServerIP"
