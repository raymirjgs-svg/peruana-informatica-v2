$ErrorActionPreference = "Stop"

# Configuración del servidor
$ServerIP = "200.58.98.122"
$Port = "5313"
$User = "root"
$RemotePath = "/root/peruana-informatica"

Write-Host "📦 Empaquetando proyecto para despliegue..." -ForegroundColor Cyan

# Definir exclusiones para no subir basura (node_modules, git, etc)
$exclude = @(
    "node_modules",
    ".next",
    ".git",
    "backend_data",
    "mysql_data",
    "redis_data",
    "*.zip"
)

# Crear archivo ZIP temporal
$source = Get-Location
$destination = "$source\admin_deploy.zip"

if (Test-Path $destination) { Remove-Item $destination }

Write-Host "Compressing files... (Esto puede tomar un momento)" -ForegroundColor Yellow
Compress-Archive -Path . -DestinationPath $destination -CompressionLevel Optimal -Update

Write-Host "✅ Archivo comprimido creado: admin_deploy.zip" -ForegroundColor Green
Write-Host "🚀 Subiendo al servidor $ServerIP..." -ForegroundColor Cyan

# Usar SCP para subir (requiere contraseña)
Write-Host "⚠️ PREPÁRATE PARA ESCRIBIR LA CONTRASEÑA DEL SERVIDOR: 9wC8/5lAhlxrXd" -ForegroundColor Magenta
Start-Sleep -Seconds 2

scp -P $Port $destination "${User}@${ServerIP}:/root/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Subida completada." -ForegroundColor Green
    Write-Host "🔧 Descomprimiendo en el servidor..." -ForegroundColor Yellow
    
    # Comandos remotos para descomprimir
    $remoteCommands = "
        rm -rf $RemotePath
        mkdir -p $RemotePath
        unzip -o /root/admin_deploy.zip -d $RemotePath
        rm /root/admin_deploy.zip
        echo '✅ Proyecto descomprimido en $RemotePath'
    "
    
    ssh -p $Port "${User}@${ServerIP}" $remoteCommands
    
    Write-Host "🎉 LISTO! Ahora sigue el Paso 3 de la guía." -ForegroundColor Green
}
else {
    Write-Host "❌ Error en la subida SCP." -ForegroundColor Red
}
