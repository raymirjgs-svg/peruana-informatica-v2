# Script de Limpieza del Proyecto
# EJECUTAR CON CUIDADO - Revisa cada comando antes

# ====================================
# 1. ELIMINAR APLICACIÓN PHP ANTIGUA
# ====================================
Write-Host "🗑️  Preparando para eliminar aplicación PHP antigua..." -ForegroundColor Yellow
Write-Host "Carpeta a eliminar: peruanadeinformatica/" -ForegroundColor Red
Write-Host "Tamaño: ~1,290 archivos" -ForegroundColor Red
$confirm = Read-Host "¿Estás seguro? (escribe 'SI' para confirmar)"

if ($confirm -eq "SI") {
    Write-Host "Eliminando..." -ForegroundColor Green
    Remove-Item -Path ".\peruanadeinformatica" -Recurse -Force
    Write-Host "✅ Carpeta PHP eliminada" -ForegroundColor Green
} else {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
}

# ====================================
# 2. BUSCAR CONSOLE.LOGS EN PRODUCCIÓN
# ====================================
Write-Host "`n🔍 Buscando console.log en el código..." -ForegroundColor Cyan
$consoleFiles = Get-ChildItem -Path ".\frontend\src" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Exclude *.test.* | 
    Select-String -Pattern "console\.(log|warn|error)" |
    Group-Object Path | 
    Select-Object -ExpandProperty Name

if ($consoleFiles) {
    Write-Host "⚠️  Archivos con console.log:" -ForegroundColor Yellow
    $consoleFiles | ForEach-Object { Write-Host "  - $_" }
    Write-Host "`n💡 Considera eliminarlos para producción" -ForegroundColor Cyan
} else {
    Write-Host "✅ No se encontraron console.log" -ForegroundColor Green
}

# ====================================
# 3. BUSCAR ARCHIVOS DUPLICADOS
# ====================================
Write-Host "`n🔍 Buscando archivos .backup, .old, .tmp..." -ForegroundColor Cyan
$backupFiles = Get-ChildItem -Path "." -Recurse -Include *.backup,*.old,*.tmp,*_BACKUP_*,*_BEFORE_* -Exclude node_modules,.next,dist,build

if ($backupFiles) {
    Write-Host "⚠️  Archivos de respaldo encontrados:" -ForegroundColor Yellow
    $backupFiles | ForEach-Object { Write-Host "  - $($_.FullName)" }
    
    $confirmClean = Read-Host "`n¿Eliminar estos archivos? (escribe 'SI' para confirmar)"
    if ($confirmClean -eq "SI") {
        $backupFiles | Remove-Item -Force
        Write-Host "✅ Archivos de respaldo eliminados" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No se encontraron archivos de respaldo" -ForegroundColor Green
}

# ====================================
# 4. VERIFICAR .ENV
# ====================================
Write-Host "`n🔐 Verificando archivos .env..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Path "." -Recurse -Include .env,.env.local,.env.development,.env.production -Exclude node_modules,.next

Write-Host "📄 Archivos .env encontrados:" -ForegroundColor Cyan
$envFiles | ForEach-Object { Write-Host "  - $($_.FullName)" }

# ====================================
# 5. VERIFICAR .gitignore
# ====================================
Write-Host "`n📝 Verificando .gitignore..." -ForegroundColor Cyan
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore"
    
    $requiredPatterns = @(".env", ".env.local", "node_modules/", ".next/", "dist/", "build/")
    $missingPatterns = @()
    
    foreach ($pattern in $requiredPatterns) {
        if ($gitignoreContent -notcontains $pattern) {
            $missingPatterns += $pattern
        }
    }
    
    if ($missingPatterns.Count -gt 0) {
        Write-Host "⚠️  Patrones faltantes en .gitignore:" -ForegroundColor Yellow
        $missingPatterns | ForEach-Object { Write-Host "  - $_" }
    } else {
        Write-Host "✅ .gitignore configurado correctamente" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .gitignore no encontrado" -ForegroundColor Red
}

# ====================================
# 6. RESUMEN
# ====================================
Write-Host "`n📊 RESUMEN DE LIMPIEZA" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

$totalSize = 0
if (Test-Path ".\peruanadeinformatica") {
    $phpSize = (Get-ChildItem -Path ".\peruanadeinformatica" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Tamaño de PHP antigua: $([math]::Round($phpSize, 2)) MB" -ForegroundColor Cyan
    $totalSize += $phpSize
}

if (Test-Path ".\frontend\node_modules") {
    $nodeSize = (Get-ChildItem -Path ".\frontend\node_modules" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Tamaño de node_modules (regenerable): $([math]::Round($nodeSize, 2)) MB" -ForegroundColor Cyan
}

Write-Host "`nEspacio que se puede liberar: ~$([math]::Round($totalSize, 2)) MB" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Magenta
