# ==========================================
# 🚀 Script de Despliegue (Windows PowerShell)
# ==========================================

Write-Host "➡️  Iniciando proceso de despliegue local..." -ForegroundColor Blue

# 1. Verificar si existe archivo .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: No se encontró el archivo .env.production" -ForegroundColor Red
    Write-Host "Por favor, crea el archivo .env.production basado en .env.production.template"
    exit 1
}

# 2. Copiar .env.production a .env
Copy-Item ".env.production" -Destination ".env" -Force

# 3. Construir imágenes
Write-Host "🏗️  Construyendo imágenes Docker..." -ForegroundColor Blue
docker-compose -f docker-compose.production.yml build

# 4. Detener contenedores antiguos
Write-Host "🛑 Deteniendo servicios actuales..." -ForegroundColor Blue
docker-compose -f docker-compose.production.yml down

# 5. Iniciar nuevos contenedores
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Blue
docker-compose -f docker-compose.production.yml up -d

# 6. Verificar estado
Write-Host "🔍 Verificando estado de los servicios..." -ForegroundColor Blue
Start-Sleep -Seconds 5
docker-compose -f docker-compose.production.yml ps

Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host "Visita: http://localhost:80"
