# Script para corregir el problema del API del frontend
Write-Host "🔧 Corrigiendo configuración del API del frontend..." -ForegroundColor Green

# 1. Construir la imagen
Write-Host "📦 Construyendo imagen del frontend..." -ForegroundColor Yellow
cd "c:\Users\VENTAS-COMP2\Desktop\Proyectos\Desplegar\peruana-informatica_v2\peruana-informatica"
docker build -t peruana-frontend:latest -f frontend/Dockerfile.prod ./frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo la imagen" -ForegroundColor Red
    exit 1
}

# 2. Guardar imagen
Write-Host "💾 Guardando imagen..." -ForegroundColor Yellow
docker save peruana-frontend:latest -o peruana-frontend.tar

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error guardando la imagen" -ForegroundColor Red
    exit 1
}

# 3. Transferir al servidor
Write-Host "📤 Transferiendo imagen al servidor..." -ForegroundColor Yellow
scp -P 5313 peruana-frontend.tar root@200.58.98.122:/root/peruana-informatica/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error transfiriendo la imagen" -ForegroundColor Red
    exit 1
}

# 4. Cargar imagen en el servidor
Write-Host "📥 Cargando imagen en el servidor..." -ForegroundColor Yellow
ssh -p 5313 root@200.58.98.122 "cd /root/peruana-informatica && docker load -i peruana-frontend.tar"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error cargando la imagen en el servidor" -ForegroundColor Red
    exit 1
}

# 5. Reiniciar frontend
Write-Host "🔄 Reiniciando contenedor frontend..." -ForegroundColor Yellow
ssh -p 5313 root@200.58.98.122 "cd /root/peruana-informatica && docker compose up -d frontend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error reiniciando el contenedor" -ForegroundColor Red
    exit 1
}

# 6. Limpiar archivo local
Write-Host "🧹 Limpiando archivo temporal..." -ForegroundColor Yellow
Remove-Item peruana-frontend.tar -Force

Write-Host "✅ ¡Frontend actualizado correctamente!" -ForegroundColor Green
Write-Host "🌐 Visita: http://200.58.98.122" -ForegroundColor Cyan
