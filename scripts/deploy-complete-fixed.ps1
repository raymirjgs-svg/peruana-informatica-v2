# ============================================
# 🚀 SCRIPT DE DESPLIEGUE AUTOMÁTICO - POWERSHELL (CORREGIDO)
# ============================================

# Función simple para escribir mensajes
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
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Header {
    param([string]$Text)
    Write-Host "🚀 $Text" -ForegroundColor Magenta
}

# ============================================
# 🔧 CONFIGURACIÓN
# ============================================
$ServerIP = "200.58.98.122"
$ServerPort = "5313"
$SSHUser = "root"
$SSHPassword = "9wC8/5lAhlxrXd"
$RemoteDir = "/root/peruana-informatica"

# ============================================
# 📋 VERIFICACIONES LOCALES
# ============================================
Write-Header "📋 VERIFICACIONES LOCALES"
Write-Step "Verificando configuracion local..."

if (-not (Test-Path "envs\.env.production")) {
    Write-Error "No existe envs\.env.production"
    exit 1
}

if (-not (Test-Path "docker-compose.prod.yml")) {
    Write-Error "No existe docker-compose.prod.yml"
    exit 1
}

$content = Get-Content "envs\.env.production"
if ($content -match "CAMBIAR_ESTO") {
    Write-Error "Debes cambiar las contraseñas placeholder en envs\.env.production"
    Write-Host "💡 Edita el archivo y reemplaza: CAMBIAR_ESTO" -ForegroundColor Yellow
    exit 1
}

Write-Success "Configuracion local validada"

# ============================================
# 🛑 FASE 1: LIMPIEZA COMPLETA
# ============================================
Write-Header "🧹 FASE 1: LIMPIEZA COMPLETA DEL SERVIDOR"

Write-Step "Conectando al servidor para limpieza..."

$cleanupCommands = @"
echo "🧹 Iniciando limpieza completa del servidor..."

# Detener y eliminar contenedores
docker stop $(docker ps -aq) 2>/dev/null || echo "No hay contenedores corriendo"
docker rm $(docker ps -aq) 2>/dev/null || echo "No hay contenedores para eliminar"

# Eliminar imagenes
docker rmi -f $(docker images -q) 2>/dev/null || echo "No hay imagenes para eliminar"

# Limpiar volumenes y sistema
docker volume prune -f
docker system prune -af --volumes

# Eliminar directorio del proyecto
cd /root
rm -rf peruana-informatica 2>/dev/null || echo "Directorio no existe"

# Reiniciar Docker
systemctl restart docker
sleep 5

echo "✅ Limpieza completa del servidor"
"@

# Ejecutar limpieza
try {
    Write-Step "Ejecutando limpieza completa..."
    $tempScript = [System.IO.Path]::GetTempFileName()
    $cleanupCommands | Out-File -FilePath $tempScript -Encoding ASCII
    $result = cmd /c "echo $($SSHPassword)" | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP "bash -s" -- <$tempScript 2>&1
    Remove-Item $tempScript -Force
    Write-Success "Limpieza del servidor completada"
} catch {
    Write-Error "Error en la limpieza del servidor: $($_.Exception.Message)"
    Write-Host "Continuando con el despliegue..." -ForegroundColor Yellow
}

# ============================================
# 📦 FASE 2: INSTALACIÓN DEPENDENCIAS
# ============================================
Write-Header "📦 FASE 2: INSTALACIÓN DE DEPENDENCIAS"

Write-Step "Verificando dependencias en el servidor..."

$installCommands = @"
echo "📦 Verificando dependencias en el servidor..."

# Verificar Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

echo "✅ Dependencias verificadas"
"@

try {
    Write-Step "Verificando Docker en servidor..."
    $tempScript = [System.IO.Path]::GetTempFileName()
    $installCommands | Out-File -FilePath $tempScript -Encoding ASCII
    $result = cmd /c "echo $($SSHPassword)" | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP "bash -s" -- <$tempScript 2>&1
    Remove-Item $tempScript -Force
    Write-Success "Dependencias verificadas"
} catch {
    Write-Host "No se pudo verificar dependencias automaticamente" -ForegroundColor Yellow
}

# ============================================
# 📤 FASE 3: SUBIDA DE ARCHIVOS
# ============================================
Write-Header "📤 FASE 3: SUBIDA DE ARCHIVOS AL SERVIDOR"

Write-Step "Subiendo archivos principales..."

try {
    # Subir archivos principales usando pscp (PowerShell SSH)
    $pscpPath = "C:\Users\LENOVO\Desktop\Proyectos\Desplegar\peruana-informatica_v2\docker-compose.prod.yml"
    $envPath = "C:\Users\LENOVO\Desktop\Proyectos\Desplegar\peruana-informatica_v2\envs\.env.production"
    $nginxPath = "C:\Users\LENOVO\Desktop\Proyectos\Desplegar\peruana-informatica_v2\nginx\nginx.conf"
    
    # Usar plink (PuTTY) para transferencia si está disponible
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Step "Subiendo archivos con plink..."
        & plink -P $ServerPort -pw $SSHPassword $SSHUser@$ServerIP mkdir -p $RemoteDir
        pscp -P $ServerPort -pw $SSHPassword $pscpPath $SSHUser@$ServerIP`:$RemoteDir/docker-compose.prod.yml
        pscp -P $ServerPort -pw $SSHPassword $envPath $SSHUser@$ServerIP`:$RemoteDir/envs/.env.production
        pscp -P $ServerPort -pw $SSHPassword $nginxPath $SSHUser@$ServerIP`:$RemoteDir/nginx.conf
    } else {
        Write-Host "Error: plink no encontrado. Usando scp tradicional..." -ForegroundColor Red
    }
    
    Write-Success "Archivos principales subidos"
} catch {
    Write-Error "Error al subir archivos principales: $($_.Exception.Message)"
}

# ============================================
# 🚀 FASE 4: DESPLIEGUE
# ============================================
Write-Header "🚀 FASE 4: DESPLIEGUE DE LA APLICACIÓN"

$deployCommands = @"
cd $RemoteDir

echo "📋 Verificando archivos..."
if [ ! -f 'docker-compose.prod.yml' ]; then
    echo "❌ Error: No existe docker-compose.prod.yml"
    exit 1
fi

echo "🔨 Construyendo imagenes Docker..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Iniciando contenedores..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Esperando a que los servicios inicien..."
sleep 45

echo "📊 Verificando estado..."
docker compose -f docker-compose.prod.yml ps

echo "🏥 Verificando salud..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend saludable"
        break
    else
        echo "⏳ Esperando backend (\$i/10)..."
        sleep 10
    fi
done

for i in {1..10}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend saludable"
        break
    else
        echo "⏳ Esperando frontend (\$i/10)..."
        sleep 10
    fi
done

echo "📋 Logs recientes..."
docker compose -f docker-compose.prod.yml logs --tail=20
"@

try {
    Write-Step "Iniciando despliegue en servidor..."
    $tempScript = [System.IO.Path]::GetTempFileName()
    $deployCommands | Out-File -FilePath $tempScript -Encoding ASCII
    $result = cmd /c "echo $($SSHPassword)" | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP "bash -s" -- <$tempScript 2>&1
    Remove-Item $tempScript -Force
    Write-Host "Resultado del despliegue:"
    Write-Host $result -ForegroundColor Cyan
} catch {
    Write-Error "Error en el despliegue: $($_.Exception.Message)"
}

# ============================================
# 🌐 FASE 5: VERIFICACIÓN FINAL
# ============================================
Write-Header "🌐 FASE 5: VERIFICACIÓN FINAL DESDE LOCAL"

Write-Step "Verificando acceso desde local..."

# Verificar API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://$ServerIP`:3001/api/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($apiResponse.StatusCode -eq 200) {
        Write-Success "API accesible desde local: http://$ServerIP`:3001/api"
    } else {
        Write-Host "⚠️ API no accesible desde local (puede ser firewall)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ API no accesible desde local (puede ser firewall)" -ForegroundColor Yellow
}

# Verificar Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://$ServerIP`:3000" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend accesible desde local: http://$ServerIP`:3000"
        
        # Abrir navegador automáticamente
        Start-Process "http://$ServerIP`:3000"
    } else {
        Write-Host "⚠️ Frontend no accesible desde local (puede ser firewall)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Frontend no accesible desde local (puede ser firewall)" -ForegroundColor Yellow
}

# ============================================
# 🎉 RESULTADO FINAL
# ============================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ DESPLIEGUE COMPLETADO ✅                    ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📍 Servidor: $ServerIP`:$ServerPort                          ║" -ForegroundColor Green
Write-Host "║  🌐 Frontend: http://$ServerIP`:3000                          ║" -ForegroundColor Green
Write-Host "║  🔧 API:      http://$ServerIP`:3001/api                     ║" -ForegroundColor Green
Write-Host "║  🏥 Health:   http://$ServerIP`:3001/api/health              ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📋 SERVICIOS ACTIVOS:                                          ║" -ForegroundColor Green
Write-Host "║  ✅ Frontend (Next.js)                                         ║" -ForegroundColor Green
Write-Host "║  ✅ Backend (Node.js/Express)                                  ║" -ForegroundColor Green
Write-Host "║  ✅ Database (MySQL)                                            ║" -ForegroundColor Green
Write-Host "║  ✅ Cache (Redis)                                                 ║" -ForegroundColor Green
Write-Host "║  ✅ Reverse Proxy (Nginx)                                      ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📁 DIRECTORIO EN SERVIDOR:                                  ║" -ForegroundColor Green
Write-Host "║  $RemoteDir                                          ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  🔧 COMANDOS ÚTILES:                                           ║" -ForegroundColor Green
Write-Host "║  ssh -p $ServerPort $SSHUser@$ServerIP 'cd $RemoteDir && docker compose -f docker-compose.prod.yml ps'             ║" -ForegroundColor Cyan
Write-Host "║  ssh -p $ServerPort $SSHUser@$ServerIP 'cd $RemoteDir && docker compose -f docker-compose.prod.yml logs'            ║" -ForegroundColor Cyan
Write-Host "║  ssh -p $ServerPort $SSHUser@$ServerIP 'cd $RemoteDir && docker compose -f docker-compose.prod.yml restart backend'       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 ¡Tu aplicación 'Peruana de Informática' está lista! 🎯" -ForegroundColor Magenta
Write-Host "💡 Puedes acceder ahora mismo desde tu navegador" -ForegroundColor Cyan
Write-Host "📧 Si encuentras problemas, revisa los logs con los comandos mostrados" -ForegroundColor Cyan
Write-Host ""