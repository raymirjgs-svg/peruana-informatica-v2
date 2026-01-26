# Script de preparación para despliegue
# Este script automatiza la preparación del proyecto para producción

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PREPARACIÓN PARA DESPLIEGUE" -ForegroundColor Cyan
Write-Host "  Peruana Informática" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

# Función para mostrar mensajes
function Write-Step {
    param([string]$message)
    Write-Host "[PASO] $message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Error {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "peruana-informatica")) {
    Write-Error "No se encuentra la carpeta 'peruana-informatica'"
    Write-Info "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
}

# Crear carpeta de despliegue
$deployDir = Join-Path $projectRoot "deploy-ready"
Write-Step "Creando carpeta de despliegue..."

if (Test-Path $deployDir) {
    Write-Info "Eliminando carpeta de despliegue anterior..."
    Remove-Item -Path $deployDir -Recurse -Force
}

New-Item -Path $deployDir -ItemType Directory | Out-Null
Write-Success "Carpeta de despliegue creada: $deployDir"

# ===============================================
# PREPARAR BACKEND
# ===============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PREPARANDO BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendSource = Join-Path $projectRoot "peruana-informatica\backend"
$backendDeploy = Join-Path $deployDir "backend"

Write-Step "Copiando archivos del backend..."
Copy-Item -Path $backendSource -Destination $backendDeploy -Recurse -Force
Write-Success "Archivos del backend copiados"

# Limpiar archivos innecesarios
Write-Step "Limpiando archivos innecesarios del backend..."
$backendCleanPaths = @(
    "node_modules",
    ".env",
    ".env.local",
    ".env.development",
    "*.log",
    ".git"
)

foreach ($path in $backendCleanPaths) {
    $fullPath = Join-Path $backendDeploy $path
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Info "  Eliminado: $path"
    }
}

# Crear .env.production de ejemplo si no existe
$envProductionPath = Join-Path $backendDeploy ".env.production"
if (-not (Test-Path $envProductionPath)) {
    Write-Step "Creando .env.production de ejemplo..."
    
    $envContent = @"
# BASE DE DATOS
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=peruana_informatica
DATABASE_USER=peruana_user
DATABASE_PASSWORD=CAMBIAR_CONTRASEÑA_AQUI

# SERVIDOR
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tudominio.com

# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tudominio.com
SMTP_PASS=CAMBIAR_APP_PASSWORD_AQUI
ADMIN_EMAIL=admin@tudominio.com

# IA (Opcional)
GEMINI_API_KEY=CAMBIAR_API_KEY_AQUI

# ERP
ERP_API_URL=http://54.144.139.115/peruanadeinformatica/api
ERP_API_TOKEN=CAMBIAR_TOKEN_AQUI

# SEGURIDAD
JWT_SECRET=CAMBIAR_CLAVE_ALEATORIA_SEGURA_AQUI
SESSION_SECRET=CAMBIAR_CLAVE_ALEATORIA_SEGURA_AQUI
"@
    
    Set-Content -Path $envProductionPath -Value $envContent
    Write-Success ".env.production creado - IMPORTANTE: Editar con valores reales"
}

# Instalar dependencias de producción
Write-Step "Instalando dependencias de producción del backend..."
Push-Location $backendDeploy
try {
    npm ci --only=production 2>&1 | Out-Null
    Write-Success "Dependencias instaladas"
} catch {
    Write-Error "Error al instalar dependencias: $_"
}

# Compilar TypeScript
Write-Step "Compilando TypeScript..."
try {
    npm run build 2>&1 | Out-Null
    Write-Success "Backend compilado exitosamente"
} catch {
    Write-Error "Error al compilar: $_"
}
Pop-Location

# ===============================================
# PREPARAR FRONTEND
# ===============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PREPARANDO FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$frontendSource = Join-Path $projectRoot "peruana-informatica\frontend"
$frontendDeploy = Join-Path $deployDir "frontend"

Write-Step "Copiando archivos del frontend..."
Copy-Item -Path $frontendSource -Destination $frontendDeploy -Recurse -Force
Write-Success "Archivos del frontend copiados"

# Limpiar archivos innecesarios
Write-Step "Limpiando archivos innecesarios del frontend..."
$frontendCleanPaths = @(
    "node_modules",
    ".next",
    ".env",
    ".env.local",
    ".env.development",
    "*.log",
    ".git"
)

foreach ($path in $frontendCleanPaths) {
    $fullPath = Join-Path $frontendDeploy $path
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Info "  Eliminado: $path"
    }
}

# Crear .env.production de ejemplo
$envProductionFrontend = Join-Path $frontendDeploy ".env.production"
if (-not (Test-Path $envProductionFrontend)) {
    Write-Step "Creando .env.production para frontend..."
    
    $envFrontendContent = @"
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_SITE_URL=https://tudominio.com
"@
    
    Set-Content -Path $envProductionFrontend -Value $envFrontendContent
    Write-Success ".env.production del frontend creado"
}

# Verificar next.config.mjs
Write-Step "Verificando next.config.mjs..."
$nextConfigPath = Join-Path $frontendDeploy "next.config.mjs"
if (Test-Path $nextConfigPath) {
    $nextConfig = Get-Content $nextConfigPath -Raw
    if ($nextConfig -notmatch "output.*standalone") {
        Write-Info "NOTA: Considera agregar 'output: standalone' en next.config.mjs para despliegue VPS"
    }
}

# Instalar dependencias
Write-Step "Instalando dependencias de producción del frontend..."
Push-Location $frontendDeploy
try {
    npm ci --only=production 2>&1 | Out-Null
    Write-Success "Dependencias instaladas"
} catch {
    Write-Error "Error al instalar dependencias: $_"
}

# Construir para producción
Write-Step "Construyendo frontend para producción..."
try {
    npm run build 2>&1 | Out-Null
    Write-Success "Frontend construido exitosamente"
} catch {
    Write-Error "Error al construir: $_"
}
Pop-Location

# ===============================================
# COPIAR DOCUMENTACIÓN
# ===============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COPIANDO DOCUMENTACIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Step "Copiando archivos de documentación..."
$docFiles = @(
    "GUIA_DESPLIEGUE.md",
    "CHECKLIST_DESPLIEGUE.md",
    "INSTRUCCIONES_INSTALACION.md",
    "INFORME_FINAL.md"
)

foreach ($file in $docFiles) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $deployDir -Force
        Write-Success "  Copiado: $file"
    }
}

# Copiar README principal
$readmePath = Join-Path $projectRoot "peruana-informatica\README.md"
if (Test-Path $readmePath) {
    Copy-Item -Path $readmePath -Destination $deployDir -Force
    Write-Success "  Copiado: README.md"
}

# ===============================================
# CREAR README DE DESPLIEGUE
# ===============================================
Write-Step "Creando README-DEPLOY.md..."

$deployReadme = @"
# 📦 PAQUETE LISTO PARA DESPLIEGUE

Este paquete contiene el proyecto Peruana Informática listo para desplegar en el hosting del cliente.

## 📁 Contenido del Paquete

- **backend/** - API REST compilada y lista para producción
- **frontend/** - Aplicación Next.js construida para producción
- **GUIA_DESPLIEGUE.md** - Guía completa paso a paso
- **CHECKLIST_DESPLIEGUE.md** - Lista de verificación
- **README.md** - Documentación general del proyecto

## ⚠️ ANTES DE DESPLEGAR

1. **Editar archivos .env.production:**
   - backend/.env.production
   - frontend/.env.production

2. **Completar con datos reales:**
   - Credenciales de base de datos del cliente
   - URL del dominio del cliente
   - Credenciales de email SMTP
   - Token del ERP (si aplica)
   - Claves de seguridad (JWT_SECRET, SESSION_SECRET)

3. **Revisar la GUIA_DESPLIEGUE.md** para instrucciones detalladas

4. **Usar CHECKLIST_DESPLIEGUE.md** para no omitir pasos

## 🚀 Inicio Rápido

### Opción 1: Hosting Compartido (cPanel)

1. Subir carpetas backend/ y frontend/ via FTP
2. Configurar Node.js Apps en cPanel
3. Seguir GUIA_DESPLIEGUE.md sección "Hosting Compartido"

### Opción 2: VPS/Cloud

1. Conectar via SSH al servidor
2. Subir archivos via rsync o git
3. Instalar PM2: `npm install -g pm2`
4. Seguir GUIA_DESPLIEGUE.md sección "VPS/Cloud"

## 📞 Soporte

Consultar la documentación incluida o contactar al equipo de desarrollo.

---
**Generado el:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

Set-Content -Path (Join-Path $deployDir "README-DEPLOY.md") -Value $deployReadme
Write-Success "README-DEPLOY.md creado"

# ===============================================
# CREAR SCRIPT DE DEPLOYMENT
# ===============================================
Write-Step "Creando scripts de deployment..."

# Script para iniciar el backend con PM2
$pm2BackendScript = @"
#!/bin/bash
cd /var/www/peruana-informatica/backend
pm2 start dist/server.js --name "peruana-backend" -i max
pm2 save
"@

Set-Content -Path (Join-Path $deployDir "start-backend-pm2.sh") -Value $pm2BackendScript
Write-Success "  Creado: start-backend-pm2.sh"

# Script para iniciar el frontend con PM2
$pm2FrontendScript = @"
#!/bin/bash
cd /var/www/peruana-informatica/frontend
pm2 start npm --name "peruana-frontend" -- start
pm2 save
"@

Set-Content -Path (Join-Path $deployDir "start-frontend-pm2.sh") -Value $pm2FrontendScript
Write-Success "  Creado: start-frontend-pm2.sh"

# ===============================================
# GENERAR RESUMEN
# ===============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PREPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📁 UBICACIÓN DEL PAQUETE:" -ForegroundColor Cyan
Write-Host "   $deployDir" -ForegroundColor White
Write-Host ""

Write-Host "📋 TAMAÑO DEL PAQUETE:" -ForegroundColor Cyan
$deploySize = (Get-ChildItem -Path $deployDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   $([math]::Round($deploySize, 2)) MB" -ForegroundColor White
Write-Host ""

Write-Host "✅ ARCHIVOS GENERADOS:" -ForegroundColor Cyan
Write-Host "   - Backend compilado (dist/)" -ForegroundColor White
Write-Host "   - Frontend construido (.next/)" -ForegroundColor White
Write-Host "   - Archivos .env.production de ejemplo" -ForegroundColor White
Write-Host "   - Documentación completa" -ForegroundColor White
Write-Host "   - Scripts de deployment" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Editar backend/.env.production con datos reales" -ForegroundColor White
Write-Host "   2. Editar frontend/.env.production con datos reales" -ForegroundColor White
Write-Host "   3. Consultar GUIA_DESPLIEGUE.md para instrucciones detalladas" -ForegroundColor White
Write-Host "   4. Usar CHECKLIST_DESPLIEGUE.md durante el despliegue" -ForegroundColor White
Write-Host "   5. Comprimir la carpeta para transferir al servidor" -ForegroundColor White
Write-Host ""

Write-Host "💡 SUGERENCIA:" -ForegroundColor Cyan
Write-Host "   Crear un archivo .zip para facilitar la transferencia:" -ForegroundColor White
Write-Host "   Compress-Archive -Path '$deployDir' -DestinationPath 'peruana-informatica-deploy.zip'" -ForegroundColor Gray
Write-Host ""

Write-Host "¡Listo para desplegar! 🚀" -ForegroundColor Green
