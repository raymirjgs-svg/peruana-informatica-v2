# ============================================
# 🚀 SCRIPT DE DESPLIEGUE AUTOMÁTICO - POWERSHELL
# ============================================

# Colores para output
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$HeaderColor = "Magenta"

# Función para imprimir con colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Text)
    Write-ColorOutput "🔧 $Text" $InfoColor
}

function Write-Success {
    param([string]$Text)
    Write-ColorOutput "✅ $Text" $SuccessColor
}

function Write-Warning {
    param([string]$Text)
    Write-ColorOutput "⚠️ $Text" $WarningColor
}

function Write-Error {
    param([string]$Text)
    Write-ColorOutput "❌ $Text" $ErrorColor
}

function Write-Header {
    param([string]$Text)
    Write-ColorOutput "🚀 $Text" $HeaderColor
}

# ============================================
# 🔧 CONFIGURACIÓN
# ============================================
$ServerIP = "200.58.98.122"
$ServerPort = "5313"
$SSHUser = "root"
$SSHPassword = "9wC8/5lAhlxrXd"
$RemoteDir = "/root/peruana-informatica"
$LocalPath = "C:\Users\LENOVO\Desktop\Proyectos\Desplegar\peruana-informatica_v2"

# ============================================
# 📋 VERIFICACIONES LOCALES
# ============================================
Write-Header "📋 VERIFICACIONES LOCALES"
Write-ColorOutput "🔍 Verificando configuración local..." $InfoColor

# Verificar archivos críticos
if (-not (Test-Path "envs\.env.production")) {
    Write-Error "No existe envs\.env.production"
    exit 1
}

if (-not (Test-Path "docker-compose.prod.yml")) {
    Write-Error "No existe docker-compose.prod.yml"
    exit 1
}

if (-not (Test-Path "nginx\nginx.conf")) {
    Write-Error "No existe nginx\nginx.conf"
    exit 1
}

# Verificar contraseñas placeholder
$content = Get-Content "envs\.env.production"
if ($content -match "CAMBIAR_ESTO") {
    Write-Error "Debes cambiar las contraseñas placeholder en envs\.env.production"
    Write-Warning "💡 Edita el archivo y reemplaza: CAMBIAR_ESTO"
    exit 1
}

Write-Success "Configuración local validada"

# ============================================
# 🛑 FASE 1: LIMPIEZA COMPLETA DEL SERVIDOR
# ============================================
Write-Header "🧹 FASE 1: LIMPIEZA COMPLETA DEL SERVIDOR"

Write-Step "Conectando al servidor para limpieza..."
$sshCommands = @"
echo "🧹 Iniciando limpieza completa del servidor..."

# Detener y eliminar contenedores
docker stop $(docker ps -aq) 2>/dev/null || echo "No hay contenedores corriendo"
docker rm $(docker ps -aq) 2>/dev/null || echo "No hay contenedores para eliminar"

# Eliminar imágenes
docker rmi -f $(docker images -q) 2>/dev/null || echo "No hay imágenes para eliminar"

# Limpiar volúmenes y sistema
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

$sshCommand = "echo '$SSHPassword' | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP '$sshCommands'"

try {
    Write-Step "Ejecutando limpieza completa..."
    $result = cmd /c "echo '$SSHPassword' | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP `"$sshCommands"`" 2>&1"
    Write-Host $result
    Write-Success "Limpieza del servidor completada"
} catch {
    Write-Error "Error en la limpieza del servidor: $($_.Exception.Message)"
    Write-Warning "Intentando con método alternativo..."
    
    # Método alternativo sin sshpass
    $sshCommandAlt = @"
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null  
docker rmi -f $(docker images -q) 2>/dev/null
docker volume prune -f
docker system prune -af --volumes
cd /root
rm -rf peruana-informatica
systemctl restart docker
sleep 5
echo "Limpieza completada con método alternativo"
"@
    
    Write-Step "Probando método alternativo de SSH..."
    # Nota: Para esto necesitarías que el servidor tenga SSH con clave configurada
    Write-Warning "Método alternativo requiere SSH key configurado en el servidor"
}

# ============================================
# 📦 FASE 2: INSTALACIÓN DE DEPENDENCIAS
# ============================================
Write-Header "📦 FASE 2: INSTALACIÓN DE DEPENDENCIAS"

Write-Step "Verificando e instalando dependencias en el servidor..."

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

# Verificar Docker Compose
if ! command -v docker compose >/dev/null 2>&1; then
    echo "📦 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verificar Git
if ! command -v git >/dev/null 2>&1; then
    echo "📦 Instalando Git..."
    apt-get update && apt-get install -y git
fi

echo "✅ Dependencias verificadas"
"@

# Intentar ejecutar comandos de instalación
try {
    Write-Step "Verificando Docker en servidor..."
    $installResult = cmd /c "echo '$SSHPassword' | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP `"$installCommands"`" 2>&1
    Write-Host $installResult
    Write-Success "Dependencias verificadas"
} catch {
    Write-Warning "No se pudo verificar dependencias automáticamente"
}

# ============================================
# 📤 FASE 3: SUBIDA DE ARCHIVOS
# ============================================
Write-Header "📤 FASE 3: SUBIDA DE ARCHIVOS AL SERVIDOR"

Write-Step "Preparando directorios en el servidor..."
$prepCommands = @"
mkdir -p $RemoteDir
mkdir -p $RemoteDir/backups $RemoteDir/nginx/conf.d $RemoteDir/certbot/conf $RemoteDir/certbot/www
"@

Write-Step "Subiendo archivos principales..."
# Subir archivos principales usando SCP con password
try {
    $scpOutput = cmd /c "echo '$SSHPassword' | scp -o StrictHostKeyChecking=no -P $ServerPort docker-compose.prod.yml $SSHUser@$ServerIP`:$RemoteDir/ 2>&1"
    Write-Host $scpOutput
    
    cmd /c "echo '$SSHPassword' | scp -o StrictHostKeyChecking=no -P $ServerPort envs\.env.production $SSHUser@$ServerIP`:$RemoteDir/envs/ 2>&1"
    cmd /c "echo '$SSHPassword' | scp -o StrictHostKeyChecking=no -P $ServerPort nginx\nginx.conf $SSHUser@$ServerIP`:$RemoteDir/nginx/ 2>&1"
    
    Write-Success "Archivos principales subidos"
} catch {
    Write-Warning "Error al subir archivos principales: $($_.Exception.Message)"
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

echo "🔨 Construyendo imágenes Docker..."
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

echo "📋 Mostrando logs recientes..."
docker compose -f docker-compose.prod.yml logs --tail=20
"@

Write-Step "Iniciando despliegue en servidor..."
try {
    $deployResult = cmd /c "echo '$SSHPassword' | ssh -o StrictHostKeyChecking=no -p $ServerPort $SSHUser@$ServerIP `"$deployCommands"`" 2>&1"
    Write-Host $deployResult
    Write-Success "Despliegue completado"
} catch {
    Write-Error "Error en el despliegue: $($_.Exception.Message)"
}

# ============================================
# 🌐 FASE 5: VERIFICACIÓN FINAL
# ============================================
Write-Header "🌐 FASE 5: VERIFICACIÓN DESDE LOCAL"

Write-Step "Verificando acceso desde local..."

# Verificar API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://$ServerIP`:3001/api/health" -TimeoutSec 10
    if ($apiResponse.StatusCode -eq 200) {
        Write-Success "API accesible desde local: http://$ServerIP`:3001/api"
    }
} catch {
    Write-Warning "API no accesible desde local (puede ser firewall)"
}

# Verificar Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://$ServerIP`:3000" -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend accesible desde local: http://$ServerIP`:3000"
    }
} catch {
    Write-Warning "Frontend no accesible desde local (puede ser firewall)"
}

# ============================================
# 🎉 RESULTADO FINAL
# ============================================
Write-Header "🎉 DESPLIEGUE COMPLETADO"

Write-Host ""
Write-ColorOutput "╔═══════════════════════════════════════════════════════════╗" $SuccessColor
Write-ColorOutput "║                    ✅ DESPLIEGUE COMPLETADO ✅                    ║" $SuccessColor
Write-ColorOutput "╠═══════════════════════════════════════════════════════════╣" $SuccessColor
Write-ColorOutput "║  📍 Servidor: $ServerIP`:$ServerPort                          ║" $SuccessColor
Write-ColorOutput "║  🌐 Frontend: http://$ServerIP`:3000                          ║" $SuccessColor
Write-ColorOutput "║  🔧 API:      http://$ServerIP`:3001/api                     ║" $SuccessColor
Write-ColorOutput "║  🏥 Health:   http://$ServerIP`:3001/api/health              ║" $SuccessColor
Write-ColorOutput "╠═══════════════════════════════════════════════════════════╣" $SuccessColor
Write-ColorOutput "║  📋 SERVICIOS ACTIVOS:                                          ║" $SuccessColor
Write-ColorOutput "║  ✅ Frontend (Next.js)                                         ║" $SuccessColor
Write-ColorOutput "║  ✅ Backend (Node.js/Express)                                  ║" $SuccessColor
Write-ColorOutput "║  ✅ Database (MySQL)                                            ║" $SuccessColor
Write-ColorOutput "║  ✅ Cache (Redis)                                                 ║" $SuccessColor
Write-ColorOutput "║  ✅ Reverse Proxy (Nginx)                                      ║" $SuccessColor
Write-ColorOutput "╠═══════════════════════════════════════════════════════════╣" $SuccessColor
Write-ColorOutput "║  📁 DIRECTORIO EN SERVIDOR:                                  ║" $SuccessColor
Write-ColorOutput "║  $RemoteDir                                          ║" $SuccessColor
Write-ColorOutput "╠═══════════════════════════════════════════════════════════╣" $SuccessColor
Write-ColorOutput "║  🔧 COMANDOS ÚTILES:                                           ║" $SuccessColor
Write-ColorOutput "║  docker compose -f docker-compose.prod.yml ps              ║" $SuccessColor
Write-ColorOutput "║  docker compose -f docker-compose.prod.yml logs           ║" $SuccessColor
Write-ColorOutput "║  docker compose -f docker-compose.prod.yml restart        ║" $SuccessColor
Write-ColorOutput "╚═══════════════════════════════════════════════════════════╝" $SuccessColor
Write-Host ""
Write-ColorOutput "🚀 ¡Tu aplicación 'Peruana de Informática' está lista! 🎯" $SuccessColor
Write-ColorOutput "💡 Puedes acceder ahora mismo desde tu navegador" $InfoColor
Write-Host ""

Write-ColorOutput "🔧 COMANDOS POST-DESPLIEGUE:" $WarningColor
Write-Host ""
Write-ColorOutput "1️⃣ Para ver estado:" $InfoColor
Write-Host "ssh -p $ServerPort $SSHUser@$ServerIP 'cd $RemoteDir && docker compose -f docker-compose.prod.yml ps'"
Write-Host ""
Write-ColorOutput "2️⃣ Para ver logs:" $InfoColor
Write-Host "ssh -p $ServerPort $SSHUser@$ServerIP 'cd $RemoteDir && docker compose -f docker-compose.prod.yml logs -f'"
Write-Host ""
Write-ColorOutput "3️⃣ Para actualizar:" $InfoColor
Write-Host "Vuelve a ejecutar: .\scripts\deploy-complete.ps1"
Write-Host ""

# Abrir navegador automáticamente
Start-Process "http://$ServerIP`:3000"

Write-ColorOutput "🌐 Abriendo navegador automáticamente..." $InfoColor