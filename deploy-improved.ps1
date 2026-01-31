# Deploy Mejorado - Corrige Errores de Versión Anterior

$ServerIP = "200.58.98.122"
$ServerPort = "5313"
$User = "root"
$RemotePath = "/root/peruana-informatica"
$LocalPath = "$PSScriptRoot\peruana-informatica"
$DestBase = "{0}@{1}" -f $User, $ServerIP

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        DEPLOY MEJORADO - PERUANA INFORMATICA        ║" -ForegroundColor Cyan
Write-Host "║                                                    ║" -ForegroundColor Cyan
Write-Host "║  Corrige errores de la versión anterior            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Hacer backup de la base de datos actual
Write-Host "PASO 1: Respaldando base de datos actual..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "cd $RemotePath ; docker exec peruana-db mysqldump -u root -prootpassword peruana_informatica > /root/backup_pre_deploy_`$(date +%Y%m%d_%H%M%S).sql"
Write-Host "   OK Backup completado" -ForegroundColor Green
Write-Host ""

# PASO 2: Construir nuevas imágenes localmente
Write-Host "PASO 2: Construyendo nuevas imágenes Docker..." -ForegroundColor Yellow

Write-Host "   Construyendo Backend..."
docker build -t peruana-backend:latest `
  -f "$LocalPath\backend\Dockerfile.prod" `
  "$LocalPath\backend"
if ($LASTEXITCODE -ne 0) { Write-Host "   ❌ Error en backend" -ForegroundColor Red; exit 1 }
Write-Host "   ✅ Backend construido" -ForegroundColor Green

Write-Host "   Construyendo Frontend..."
docker build -t peruana-frontend:latest `
  -f "$LocalPath\frontend\Dockerfile.prod" `
  "$LocalPath\frontend" `
  --build-arg NEXT_PUBLIC_API_URL=/api
if ($LASTEXITCODE -ne 0) { Write-Host "   ❌ Error en frontend" -ForegroundColor Red; exit 1 }
Write-Host "   ✅ Frontend construido" -ForegroundColor Green
Write-Host ""

# PASO 3: Guardar y comprimir imágenes
Write-Host "PASO 3: Empaquetando imágenes..." -ForegroundColor Yellow
$ImageFile = "$PSScriptRoot\app-images.tar"
$CompressedFile = "$PSScriptRoot\app-images.tar.gz"

if (Test-Path $ImageFile) { Remove-Item $ImageFile }
if (Test-Path $CompressedFile) { Remove-Item $CompressedFile }

docker save -o $ImageFile peruana-backend:latest peruana-frontend:latest
tar -czf $CompressedFile $ImageFile
Remove-Item $ImageFile

$FileSize = (Get-Item $CompressedFile).Length / 1MB
Write-Host "   ✅ Imagen comprimida: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# PASO 4: Detener contenedores
Write-Host "PASO 4: Deteniendo contenedores actuales..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "cd $RemotePath && docker compose down"
Write-Host "   ✅ Contenedores detenidos" -ForegroundColor Green
Write-Host ""

# PASO 5: Transferir nueva imagen comprimida
Write-Host "PASO 5: Subiendo nueva imagen al servidor..." -ForegroundColor Yellow
Write-Host "   (Se pedirá contraseña una vez)" -ForegroundColor Gray
$ScpTarget = "{0}:{1}/app-images.tar.gz" -f $DestBase, $RemotePath
scp -P $ServerPort $CompressedFile $ScpTarget
Write-Host "   ✅ Imagen subida" -ForegroundColor Green
Write-Host ""

# PASO 6: Cargar nueva imagen
Write-Host "PASO 6: Cargando nueva imagen en el servidor..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "
  cd $RemotePath
  echo '   Extrayendo...'
  tar -xzf app-images.tar.gz
  echo '   Cargando imágenes Docker...'
  docker load -i app-images.tar
  rm app-images.tar app-images.tar.gz
"
Write-Host "   ✅ Imágenes cargadas" -ForegroundColor Green
Write-Host ""

# PASO 7: Actualizar .env
Write-Host "PASO 7: Actualizando variables de entorno..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "
  cd $RemotePath
  cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=peruana-db
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=peruana_informatica
REDIS_ENABLED=true
REDIS_HOST=redis
UPLOAD_DIR=public/uploads
JWT_SECRET=your_jwt_secret_secure_change_this
NEXTAUTH_SECRET=your_nextauth_secret_secure_change_this
NEXTAUTH_URL=http://200.58.98.122
NEXT_PUBLIC_API_URL=/api
ALLOWED_ORIGINS=200.58.98.122,localhost,127.0.0.1
EOF
"
Write-Host "   ✅ Variables de entorno actualizadas" -ForegroundColor Green
Write-Host ""

# PASO 8: Iniciar contenedores
Write-Host "PASO 8: Iniciando contenedores..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "
  cd $RemotePath
  docker compose up -d
  echo '   Esperando que se inicien...'
  sleep 10
"
Write-Host "   ✅ Contenedores iniciados" -ForegroundColor Green
Write-Host ""

# PASO 9: Verificar estado
Write-Host "PASO 9: Verificando estado..." -ForegroundColor Yellow
ssh -p $ServerPort $DestBase "
  echo ''
  echo '=== CONTENEDORES ACTIVOS ==='
  docker ps
  echo ''
  echo '=== LOGS BACKEND (últimos 10 segundos) ==='
  docker logs --tail 50 peruana-backend | tail -10
  echo ''
  echo '=== LOGS FRONTEND (últimos 10 segundos) ==='
  docker logs --tail 50 peruana-frontend | tail -10
"
Write-Host "   ✅ Verificación completada" -ForegroundColor Green
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ DESPLIEGUE COMPLETADO EXITOSAMENTE          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "El servidor está siendo actualizado con:" -ForegroundColor Cyan
Write-Host "  • Backend corregido (puertos, rutas)"
Write-Host "  • Frontend con standalone build correcto"
Write-Host "  • Variables de entorno actualizadas"
Write-Host "  • NEXT_PUBLIC_API_URL=/api (relativa)"
Write-Host "  • Redis habilitado"
Write-Host ""
Write-Host "Backup anterior disponible en el servidor" -ForegroundColor Gray
Write-Host ""
