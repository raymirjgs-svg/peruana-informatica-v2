$Host_IP = "200.58.98.122"
$Port = "5313"
$User = "root"
$Password = "9wC8/5lAhlxrXd"

# Comandos a ejecutar en el servidor
$RemoteCommands = @(
    "echo '========== CONTENEDORES ACTIVOS =========='",
    "docker ps",
    "echo ''",
    "echo '========== TODOS LOS CONTENEDORES =========='",
    "docker ps -a",
    "echo ''",
    "echo '========== IMÁGENES DOCKER =========='",
    "docker images",
    "echo ''",
    "echo '========== VOLÚMENES =========='",
    "docker volume ls",
    "echo ''",
    "echo '========== DIRECTORIOS PRINCIPALES =========='",
    "ls -la /opt 2>/dev/null || ls -la /home 2>/dev/null || ls -la /root | head -20",
    "echo ''",
    "echo '========== DOCKER-COMPOSE FILES =========='",
    "find / -maxdepth 3 -name 'docker-compose*.yml' 2>/dev/null",
    "echo ''",
    "echo '========== LOGS BACKEND (últimas 20 líneas) =========='",
    "docker logs peruana-backend 2>/dev/null | tail -20",
    "echo ''",
    "echo '========== STATUS DEL NGINX =========='",
    "docker logs peruana-nginx 2>/dev/null | tail -10"
) -join "; "

Write-Host "Creando conexión SSH y ejecutando comandos..." -ForegroundColor Yellow
Write-Host ""

# Usar plink (si está disponible) o crear archivo .sh para ejecutar
$ScriptFile = "$env:TEMP\remote_check.sh"
$RemoteCommands | Out-File -FilePath $ScriptFile -Encoding UTF8

Write-Host "Script creado: $ScriptFile" -ForegroundColor Gray

# Intentar conexión directa sin password prompt (esperará interactivo)
Write-Host ""
Write-Host "Nota: Se pedirá contraseña. Ingresa: 9wC8/5lAhlxrXd" -ForegroundColor Cyan
Write-Host ""

ssh -p $Port $User@$Host_IP $RemoteCommands
