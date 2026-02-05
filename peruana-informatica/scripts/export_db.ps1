$ErrorActionPreference = "Stop"

Write-Host "📦 Iniciando respaldo de base de datos local..." -ForegroundColor Cyan

# Crear directorio de backups si no existe
New-Item -ItemType Directory -Force -Path ".\backups" | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = ".\backups\backup_$timestamp.sql"

# Comando docker para volcar la BD
# Nota: Asume que el contenedor se llama 'peruana-local-db' y la password es 'rootpassword'
# Usa mysqldump dentro del contenedor para generar el archivo SQL
docker exec peruana-local-db mysqldump -u root -prootpassword peruana_informatica > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Respaldo creado exitosamente en: $backupFile" -ForegroundColor Green
    Write-Host "📝 Instrucciones para el servidor:" -ForegroundColor Yellow
    Write-Host "   1. Copia este archivo al servidor."
    Write-Host "   2. En el servidor, ejecuta: cat $backupFile | docker exec -i peruana-db mysql -u root -prootpassword peruana_db"
}
else {
    Write-Host "❌ Error al crear el respaldo." -ForegroundColor Red
}
