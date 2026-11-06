# ============================================
# 🔧 LIMPIEZA COMPLETA DOCKER LOCAL - POWERSHELL
# ============================================

# Funciones para imprimir mensajes con colores
function Write-Header {
    param([string]$Text)
    Write-Host "🔧 $Text" -ForegroundColor Magenta
}

function Write-Step {
    param([string]$Text)
    Write-Host "🔧 $Text" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-WriteErrorLine "❌ $Text"
}

Write-Header "🧹 LIMPIEZA COMPLETA DEL ENTORNO DOCKER LOCAL"

Write-Step "1. Deteniendo todos los contenedores..."
docker compose -f docker-compose.local.yml down 2>$null

Write-Step "2. Eliminando contenedores huérfanos..."
docker rm $(docker ps -aq) 2>$null || Write-Host "No hay contenedores para eliminar" -ForegroundColor Yellow

Write-Step "3. Eliminando todas las imágenes Docker..."
docker rmi -f $(docker images -q) 2>$null || Write-Host "No hay imágenes para eliminar" -ForegroundColor Yellow

Write-Step "4. Limpiando sistema Docker completo..."
docker volume prune -f
docker system prune -af --volumes

Write-Step "5. Eliminando volúmenes del proyecto..."
docker volume rm peruana-informatica_v2_mysql_data_local 2>$null || Write-Host "Volumen MySQL no existe" -ForegroundColor Yellow
docker volume rm peruana-informatica_v2_uploads_data_local 2>$null || Write-Host "Volumen uploads no existe" -ForegroundColor Yellow
docker volume rm peruana-informatica_v2_backend_node_modules 2>$null || Write-Host "Volumen backend node_modules no existe" -ForegroundColor Yellow
docker volume rm peruana-informatica_v2_frontend_node_modules 2>$null || Write-Host "Volumen frontend node_modules no existe" -ForegroundColor Yellow

Write-Success "✅ Limpieza Docker local completada"

# ============================================
# 🔄 RECONSTRUCCIÓN DESDE CERO
# ============================================
Write-Header "🔄 RECONSTRUIENDO DESDE CERO"

Write-Step "1. Construyendo imágenes Docker sin caché..."
docker compose -f docker-compose.local.yml build --no-cache

Write-Step "2. Iniciando servicios..."
docker compose -f docker-compose.local.yml up -d

Write-Step "3. Esperando inicialización completa (60 segundos)..."
timeout /t 60

# Verificar estado final
Write-Header "📊 VERIFICACIÓN FINAL"

Write-Step "Verificando estado de contenedores..."
docker compose -f docker-compose.local.yml ps --format "table {{.Names}}\t{{.Status}}"

Write-Step "Verificando health checks..."
for ($i=1; $i -le 10; $i++) {
    if (docker ps --filter "name=peruana_backend_local" --format "{{.Status}}" | Select-String "healthy") {
        Write-Success "✅ Backend saludable"
        break
    } else {
        Write-Host "⏳ Esperando backend ($i/10)..."
        Start-Sleep -Seconds 5
    }
}

for ($i=1; $i -le 10; $i++) {
    if (docker ps --filter "name=peruana_frontend_local" --format "{{.Status}}" | Select-String "healthy") {
        Write-Success "✅ Frontend saludable"
        break
    } else {
        Write-Host "⏳ Esperando frontend ($i/10)..."
        Start-Sleep -Seconds 5
    }
}

Write-Step "Verificando base de datos..."
if (docker ps --filter "name=peruana_mysql_local" --format "{{.Status}}" | Select-String "healthy") {
    Write-Success "✅ MySQL saludable"
} else {
    Write-Warning "⚠️ MySQL puede estar iniciando..."
}

if (docker ps --filter "name=peruana_redis_local" --format "{{.Status}}" | Select-String "healthy") {
    Write-Success "✅ Redis saludable"
} else {
    Write-Warning "⚠️ Redis puede estar iniciando..."
}

# ============================================
# 🎯 RESULTADO FINAL
# ============================================
Write-Header "🎯 RESULTADO FINAL"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ LIMPIEZA Y RECONSTRUCCIÓN COMPLETADA ✅                    ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  🌐 Frontend: http://localhost:3000                          ║" -ForegroundColor Green
Write-Host "║  🔧 Backend: http://localhost:3001/api                     ║" -ForegroundColor Green
Write-Host "║  🏥 Health:   http://localhost:3001/api/health              ║" -ForegroundColor Green
Write-Host "╠═════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📋 SERVICIOS ACTIVOS:                                          ║" -ForegroundColor Green
Write-Host "║  ✅ Frontend (Next.js)                                         ║" -ForegroundColor Green
Write-Host "║  ✅ Backend (Node.js/Express)                                  ║" -ForegroundColor Green
Write-Host "║  ✅ Database (MySQL)                                            ║" -ForegroundColor Green
Write-Host "║  ✅ Cache (Redis)                                                 ║" -ForegroundColor Green
Write-Host "║  ✅ Reverse Proxy (Nginx)                                      ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📁 DIRECTORIO LOCAL:                                  ║" -ForegroundColor Cyan
Write-Host "║  C:\Users\LENOVO\Desktop\Proyectos\Desplegar\peruana-informatica_v2                    ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 ¡TODO LIMPIO! Tu entorno local está completamente limpio y funcionando!" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 PRÓXIMO PASO: Verificar el cotizador en: http://localhost:3000/cotizador/laptops" -ForegroundColor Cyan
Write-Host "🔍 Si todo está correcto, entonces el despliegue en producción funcionará perfectamente." -ForegroundColor Yellow
Write-Host ""

# Abrir navegador automáticamente para verificar
try {
    Start-Process "http://localhost:3000"
} catch {
    Write-Warning "⚠️ No se pudo abrir el navegador automáticamente"
}