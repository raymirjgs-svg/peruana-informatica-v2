# test-local.ps1
# Script para probar el entorno de producción en local

Write-Host "🚀 Iniciando pruebas de producción en local..." -ForegroundColor Cyan

# 1. Asegurar que las imágenes existan
if (-not (docker images -q peruana-backend:latest)) {
    Write-Host "⚠️ Imagen de Backend no encontrada. Construyendo..."
    docker build -t peruana-backend:latest -f peruana-informatica/backend/Dockerfile.prod peruana-informatica/backend
}

if (-not (docker images -q peruana-frontend:latest)) {
    Write-Host "⚠️ Imagen de Frontend no encontrada. Construyendo..."
    docker build -t peruana-frontend:latest -f peruana-informatica/frontend/Dockerfile.prod peruana-informatica/frontend
}

# 2. Levantar entorno con docker-compose.prod.yml
Write-Host "🐳 Levantando contenedores..."
Set-Location peruana-informatica
docker compose -f docker-compose.prod.yml up -d

Write-Host "✅ Entorno levantado." -ForegroundColor Green
Write-Host "🌍 Frontend: http://localhost"
Write-Host "⚙️ Backend:  http://localhost/api"
Write-Host "📋 Logs:     docker compose -f docker-compose.prod.yml logs -f"
