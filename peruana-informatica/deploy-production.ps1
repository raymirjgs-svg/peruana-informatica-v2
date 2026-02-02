# ==========================================
# 🚀 Script de Despliegue PRODUCCIÓN (PowerShell)
# ==========================================

Write-Host "➡️  Iniciando proceso de despliegue en PRODUCCIÓN..." -ForegroundColor Cyan

# 1. Verificar .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ FATAL: No existe .env.production" -ForegroundColor Red
    exit 1
}

# 2. Copiar variables a .env (para docker-compose)
Write-Host "📝 Cargando variables de entorno..." -ForegroundColor Yellow
Copy-Item ".env.production" -Destination ".env" -Force

# Leer variables para debug (Básico, lee línea por línea buscando la clave)
$envContent = Get-Content .env.production
$apiUrlLine = $envContent | Select-String "NEXT_PUBLIC_API_URL="
if ($apiUrlLine) {
    Write-Host "ℹ️  Configuración detectada para Frontend:" -ForegroundColor Cyan
    Write-Host "   $apiUrlLine" -ForegroundColor Green
    Write-Host "   (Asegúrate de que esta URL sea accesible desde el navegador del usuario)" -ForegroundColor Gray
}

# 3. Limpieza profunda (Opcional, pregunta al usuario)
$clean = Read-Host "¿Deseas eliminar VOLÚMENES y base de datos existente? (s/N)"
if ($clean -eq 's') {
    Write-Host "⚠️  Eliminando todos los contenedores y volúmenes..." -ForegroundColor Red
    docker-compose -f docker-compose.production.yml down -v
}
else {
    Write-Host "🛑 Deteniendo contenedores (manteniendo datos)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.production.yml down
}

# 4. Reconstrucción FUERTE
Write-Host "🏗️  Reconstruyendo imágenes (Sin caché)..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml build --no-cache

# 5. Iniciar
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml up -d

# 6. Esperar y Mostrar Estado
Write-Host "⏳ Esperando a que los servicios inicien (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
docker-compose -f docker-compose.production.yml ps

Write-Host "📜 Logs recientes del Backend:" -ForegroundColor Magenta
docker logs peruana-backend --tail 20

Write-Host "✅ Proceso finalizado." -ForegroundColor Green
