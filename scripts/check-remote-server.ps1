# Script para conectar y revisar servidor remoto

$Host_IP = "200.58.98.122"
$Port = "5313"
$User = "root"
$Password = "9wC8/5lAhlxrXd"

Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   CONECTANDO AL SERVIDOR REMOTO" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Host: ${Host_IP}:${Port}" -ForegroundColor Green
Write-Host "Usuario: $User" -ForegroundColor Green
Write-Host ""

# Crear archivo temporal con comandos
$commands = @"
echo '═══════════════════════════════════════════'
echo '   ESTADO ACTUAL DEL SERVIDOR'
echo '═══════════════════════════════════════════'
echo ''
echo 'CONTENEDORES ACTIVOS:'
docker ps

echo ''
echo 'TODOS LOS CONTENEDORES:'
docker ps -a

echo ''
echo 'IMÁGENES DISPONIBLES:'
docker images

echo ''
echo 'VOLÚMENES:'
docker volume ls

echo ''
echo 'DIRECTORIO ACTUAL:'
pwd

echo ''
echo 'ARCHIVOS EN DIRECTORIO ACTUAL:'
ls -la

echo ''
echo 'LOGS BACKEND (últimas 30 líneas):'
docker logs peruana-backend 2>/dev/null | tail -30

echo ''
echo 'LOGS FRONTEND (últimas 30 líneas):'
docker logs peruana-frontend 2>/dev/null | tail -30
"@

# Intentar conexión
Write-Host "Conectando..." -ForegroundColor Yellow
ssh -p $Port $User@$Host_IP $commands
