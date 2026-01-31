# Validacion de Mejoras Implementadas
# Script para verificar que todos los cambios se aplicaron correctamente

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   VALIDACION DE MEJORAS PRE-DESPLIEGUE" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Colores
$successColor = "Green"
$warningColor = "Yellow"
$errorColor = "Red"

# 1. Validar docker-compose.prod.yml
Write-Host "1. Validando docker-compose.prod.yml..." -ForegroundColor Blue
$prodCompose = Get-Content "peruana-informatica/docker-compose.prod.yml" -Raw

if ($prodCompose -match "frontend:\s+image: peruana-frontend:latest") {
    Write-Host "   OK Frontend usa 'image:' (no build:)" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Frontend aun usa 'build:'" -ForegroundColor $errorColor
}

if ($prodCompose -notmatch "build:\s+context: ./frontend") {
    Write-Host "   OK Frontend 'build:' eliminado" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Frontend aun tiene 'build:'" -ForegroundColor $errorColor
}

if ($prodCompose -match "expose:" -and $prodCompose -match "expose:\s+-\s+.3001.") {
    Write-Host "   OK Backend usa 'expose:' (puerto privado)" -ForegroundColor $successColor
} else {
    Write-Host "   ADVERTENCIA Backend no tiene 'expose:' configurado" -ForegroundColor $warningColor
}

Write-Host ""

# 2. Validar backend/src/server.ts
Write-Host "2. Validando backend/src/server.ts..." -ForegroundColor Blue
$serverTs = Get-Content "peruana-informatica/backend/src/server.ts" -Raw

if ($serverTs -match "const PORT = process.env.PORT \|\| 3001") {
    Write-Host "   OK Puerto backend correcto (3001)" -ForegroundColor $successColor
} elseif ($serverTs -match "const PORT = process.env.PORT \|\| 3002") {
    Write-Host "   FALLO Puerto backend incorrecto (3002)" -ForegroundColor $errorColor
} else {
    Write-Host "   ADVERTENCIA Puerto backend no determinado" -ForegroundColor $warningColor
}

Write-Host ""

# 3. Validar docker-compose.yml (desarrollo)
Write-Host "3. Validando docker-compose.yml (desarrollo)..." -ForegroundColor Blue
$devCompose = Get-Content "peruana-informatica/docker-compose.yml" -Raw

if ($devCompose -match "redis_data:/data") {
    Write-Host "   OK Redis volumen configurado" -ForegroundColor $successColor
} else {
    Write-Host "   ADVERTENCIA Redis volumen no configurado" -ForegroundColor $warningColor
}

Write-Host ""

# 4. Validar Nginx config
Write-Host "4. Validando Nginx config..." -ForegroundColor Blue
$nginxConf = Get-Content "peruana-informatica/nginx/conf.d/default.conf" -Raw

if ($nginxConf -match "proxy_pass http://backend:3001") {
    Write-Host "   OK Nginx apunta a backend:3001" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Nginx no apunta a backend:3001" -ForegroundColor $errorColor
}

if ($nginxConf -match "listen 80") {
    Write-Host "   OK Nginx escucha en puerto 80" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Nginx no escucha en puerto 80" -ForegroundColor $errorColor
}

Write-Host ""

# 5. Validar archivo de mejoras
Write-Host "5. Validando documentacion..." -ForegroundColor Blue
if (Test-Path "MEJORAS_IMPLEMENTADAS.md") {
    Write-Host "   OK Archivo MEJORAS_IMPLEMENTADAS.md existe" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Archivo MEJORAS_IMPLEMENTADAS.md no encontrado" -ForegroundColor $errorColor
}

if (Test-Path "PLAN_DESPLIEGUE_FINAL.md") {
    Write-Host "   OK Archivo PLAN_DESPLIEGUE_FINAL.md existe" -ForegroundColor $successColor
} else {
    Write-Host "   FALLO Archivo PLAN_DESPLIEGUE_FINAL.md no encontrado" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   VALIDACION COMPLETADA" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Configurar .env con valores de produccion"
Write-Host "   2. Ejecutar: .\test-local.ps1"
Write-Host "   3. Generar imagenes si no existen"
Write-Host "   4. Ejecutar: .\deploy.ps1"
Write-Host ""
