# ============================================
# 🚀 Despliegue para Producción - Windows PowerShell
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "200.58.98.122"
)

# Colores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# ============================================
# 1. VALIDACIONES LOCALES
# ============================================
Write-ColorOutput "📋 Validando configuración local..." "Yellow"

# Verificar que existe .env.production
if (-not (Test-Path "envs\.env.production")) {
    Write-ColorOutput "❌ Error: No existe envs\.env.production" "Red"
    exit 1
}

# Leer y verificar variables críticas
$envContent = Get-Content "envs\.env.production"
$mysqlRootPassword = ""
$mysqlPassword = ""

foreach ($line in $envContent) {
    if ($line.StartsWith("MYSQL_ROOT_PASSWORD=")) {
        $mysqlRootPassword = $line.Split("=")[1]
    }
    if ($line.StartsWith("MYSQL_PASSWORD=")) {
        $mysqlPassword = $line.Split("=")[1]
    }
}

if ([string]::IsNullOrEmpty($mysqlRootPassword) -or $mysqlRootPassword -like "*CAMBIAR*") {
    Write-ColorOutput "❌ Error: Debes configurar MYSQL_ROOT_PASSWORD en envs\.env.production" "Red"
    exit 1
}

if ([string]::IsNullOrEmpty($mysqlPassword) -or $mysqlPassword -like "*CAMBIAR*") {
    Write-ColorOutput "❌ Error: Debes configurar MYSQL_PASSWORD en envs\.env.production" "Red"
    exit 1
}

Write-ColorOutput "✅ Configuración local validada" "Green"

# ============================================
# 2. CONEXIÓN SSH AL SERVIDOR
# ============================================
Write-ColorOutput "🔗 Conectando al servidor $ServerIP..." "Yellow"

# Test de conexión SSH
try {
    $sshTest = ssh root@$ServerIP "echo 'Conexión SSH exitosa'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
} catch {
    Write-ColorOutput "❌ Error: No se puede conectar por SSH al servidor $ServerIP" "Red"
    Write-ColorOutput "💡 Asegúrate de tener configurado el acceso SSH sin contraseña" "Yellow"
    exit 1
}

Write-ColorOutput "✅ Conexión SSH establecida" "Green"

# ============================================
# 3. PREPARACIÓN DEL SERVIDOR
# ============================================
Write-ColorOutput "🔧 Preparando servidor..." "Yellow"

$remoteDir = "/root/peruana-informatica"

ssh root@$ServerIP @"
    # Crear directorio del proyecto si no existe
    mkdir -p $remoteDir
    cd $remoteDir
    
    # Backup de datos actuales (si existen)
    if [ -d "backups" ]; then
        echo "💾 Haciendo backup de datos existentes..."
        mv backups backups_\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
    
    # Crear estructura de directorios
    mkdir -p backups nginx/conf.d certbot/conf certbot/www
    
    # Instalar Docker si no está instalado
    if ! command -v docker &> /dev/null; then
        echo "📦 Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    
    # Instalar Docker Compose si no está instalado
    if ! command -v docker compose &> /dev/null; then
        echo "📦 Instalando Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Detener y limpiar contenedores antiguos
    echo "🧹 Limpiando contenedores antiguos..."
    cd $remoteDir
    docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    echo "✅ Servidor preparado"
"@

Write-ColorOutput "✅ Servidor preparado" "Green"

# ============================================
# 4. SUBIDA DE ARCHIVOS
# ============================================
Write-ColorOutput "📤 Subiendo archivos al servidor..." "Yellow"

# Crear archivo temporal con IP configurada
$tempEnvFile = "env\.temp.env.production"
(Get-Content "envs\.env.production") | ForEach-Object {
    $_ -replace "200\.58\.98\.122", $ServerIP
} | Set-Content $tempEnvFile

# Subir archivos críticos
scp -q docker-compose.prod.yml root@$ServerIP`:$remoteDir/
scp -q $tempEnvFile root@$ServerIP`:$remoteDir/envs/.env.production
scp -q nginx\nginx.conf root@$ServerIP`:$remoteDir/
scp -q peruana-informatica\backend\Dockerfile.prod root@$ServerIP`:$remoteDir/peruana-informatica/backend/
scp -q peruana-informatica\frontend\Dockerfile.prod root@$ServerIP`:$remoteDir/peruana-informatica/frontend/

# Subir código fuente (usando tar para eficiencia)
Write-Host "📦 Subiendo código fuente..."
tar -czf - peruana-informatica/ --exclude=node_modules --exclude=dist --exclude=.next --exclude=.git | ssh root@$ServerIP "cd $remoteDir && tar -xzf -"

# Subir scripts
tar -czf - scripts/ | ssh root@$ServerIP "cd $remoteDir && tar -xzf -"

# Limpiar archivo temporal
Remove-Item $tempEnvFile -Force

Write-ColorOutput "✅ Archivos subidos" "Green"

# ============================================
# 5. DESPLIEGUE EN EL SERVIDOR
# ============================================
Write-ColorOutput "🚀 Iniciando despliegue en servidor..." "Yellow"

ssh root@$ServerIP @"
    cd $remoteDir
    
    # Verificar archivos críticos
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo "❌ Error: No existe docker-compose.prod.yml"
        exit 1
    fi
    
    if [ ! -f "envs/.env.production" ]; then
        echo "❌ Error: No existe envs/.env.production"
        exit 1
    fi
    
    # Construir y levantar contenedores
    echo "🔨 Construyendo imágenes..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    echo "🚀 Iniciando contenedores..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Esperar a que los servicios estén saludables
    echo "⏳ Esperando que los servicios inicien..."
    sleep 30
    
    # Verificar estado
    echo "📊 Verificando estado de contenedores:"
    docker compose -f docker-compose.prod.yml ps
    
    # Verificar health checks
    echo "🏥 Verificando health checks..."
    
    # Backend health
    for i in {1..10}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            echo "✅ Backend saludable"
            break
        else
            echo "⏳ Esperando backend (\$i/10)..."
            sleep 10
        fi
    done
    
    # Frontend health
    for i in {1..10}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend saludable"
            break
        else
            echo "⏳ Esperando frontend (\$i/10)..."
            sleep 10
        fi
    done
    
    echo "🔍 Mostrando logs recientes..."
    docker compose -f docker-compose.prod.yml logs --tail=20
"@

Write-ColorOutput "✅ Despliegue completado" "Green"

# ============================================
# 6. VERIFICACIÓN FINAL
# ============================================
Write-ColorOutput "🔍 Verificación final..." "Yellow"

# Probar conexión desde local
Write-Host "🌐 Probando acceso desde local..."

# Test de API
try {
    $apiTest = Invoke-RestMethod -Uri "http://$ServerIP`:3001/api/health" -TimeoutSec 10
    Write-ColorOutput "✅ API accesible desde local" "Green"
} catch {
    Write-ColorOutput "⚠️ API no accesible desde local (puede ser firewall)" "Yellow"
}

# Test de frontend
try {
    $frontendTest = Invoke-WebRequest -Uri "http://$ServerIP`:3000" -TimeoutSec 10
    Write-ColorOutput "✅ Frontend accesible desde local" "Green"
} catch {
    Write-ColorOutput "⚠️ Frontend no accesible desde local (puede ser firewall)" "Yellow"
}

Write-ColorOutput "🎉 Despliegue finalizado!" "Blue"
Write-ColorOutput "📱 Aplicación disponible en: http://$ServerIP`:3000" "Blue"
Write-ColorOutput "🔧 API disponible en: http://$ServerIP`:3001/api" "Blue"
Write-ColorOutput "💡 No olvides configurar SSL y dominio cuando esté listo" "Yellow"