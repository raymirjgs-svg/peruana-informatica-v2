# fix-deployment.ps1 - Script para corregir problemas de despliegue

Write-Host "🔧 CORRIGIENDO PROBLEMAS DE DESPLIEGUE..." -ForegroundColor Yellow

# --- 1. CORREGIR INCONSISTENCIA DE IPs ---
Write-Host "1. Corrigiendo IPs en archivos..." -ForegroundColor Cyan

$ServerIP = "200.58.98.122"  # IP actual del servidor

# Corregir frontend Dockerfile.prod
$frontendDockerfile = "$PSScriptRoot\peruana-informatica\frontend\Dockerfile.prod"
$content = Get-Content $frontendDockerfile
$content = $content -replace "NEXT_PUBLIC_API_URL=http://149\.50\.144\.210/api", "NEXT_PUBLIC_API_URL=http://$ServerIP/api"
$content = $content -replace "149\.50\.144\.210", $ServerIP
Set-Content $frontendDockerfile $content

# Corregir .env.example
$envExample = "$PSScriptRoot\peruana-informatica\.env.example"
$content = Get-Content $envExample
$content = $content -replace "149\.50\.144\.210", $ServerIP
Set-Content $envExample $content

Write-Host "   ✅ IPs actualizadas a $ServerIP" -ForegroundColor Green

# --- 2. CORREGIR VOLUMEN DE REDIS ---
Write-Host "2. Corrigiendo volumen de Redis..." -ForegroundColor Cyan

$composeFile = "$PSScriptRoot\peruana-informatica\docker-compose.prod.yml"
$content = Get-Content $composeFile

# Agregar volumen a servicio redis
$redisService = @"
  redis:
    image: redis:alpine
    restart: always
    container_name: peruana-redis
    volumes:
      - redis_data:/data
"@

$content = $content -replace "  redis:\s*\n\s*image: redis:alpine\s*\n\s*restart: always\s*\n\s*container_name: peruana-redis", $redisService.Trim()
Set-Content $composeFile $content

Write-Host "   ✅ Volumen de Redis configurado" -ForegroundColor Green

# --- 3. CREAR .env DE PRODUCCIÓN ---
Write-Host "3. Creando .env de producción..." -ForegroundColor Cyan

$envProd = @"
# --- SERVER CONFIG ---
PORT=3001
NODE_ENV=production
PUBLIC_IP=$ServerIP

# --- FRONTEND ---
NEXT_PUBLIC_API_URL=http://$ServerIP/api
NEXTAUTH_URL=http://$ServerIP
NEXTAUTH_SECRET=openssl_rand_base64_32_secure_key_here

# --- DATABASE ---
DB_HOST=db
DB_USER=root
DB_PASSWORD=secure_password_2024
DB_NAME=peruana_db
DB_PORT=3306
DB_DIALECT=mysql

# --- REDIS ---
REDIS_HOST=redis
REDIS_PORT=6379

# --- SECURITY ---
JWT_SECRET=super_secure_jwt_key_2024
CORS_ORIGIN=http://localhost:3000,http://$ServerIP

# --- SMTP (EMAIL) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuemail@gmail.com
SMTP_PASS=app_password_here
"@

Set-Content "$PSScriptRoot\peruana-informatica\.env" $envProd

Write-Host "   ✅ .env creado (RECUERDA actualizar contraseñas)" -ForegroundColor Yellow

# --- 4. CORREGIR CONFIGURACIÓN NGINX ---
Write-Host "4. Mejorando configuración Nginx..." -ForegroundColor Cyan

$nginxConfig = "$PSScriptRoot\peruana-informatica\nginx\conf.d\default.conf"
$nginxContent = @"
server {
    listen 80;
    server_name $ServerIP;

    # Aumentar timeouts para Next.js
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Health Check
    location /health {
        proxy_pass http://backend:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Headers para Next.js
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # NextAuth
    location /api/auth {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Documentación
    location /api-docs {
        proxy_pass http://backend:3001/api-docs;
    }

    # Imágenes y Uploads
    location /images {
        proxy_pass http://backend:3001/images;
    }
    
    location /uploads {
        proxy_pass http://backend:3001/uploads;
    }
}
"@

Set-Content $nginxConfig $nginxContent

Write-Host "   ✅ Nginx configurado" -ForegroundColor Green

# --- 5. CREAR SCRIPT DE DIAGNÓSTICO ---
Write-Host "5. Creando script de diagnóstico..." -ForegroundColor Cyan

$diagnosticScript = @"
#!/bin/bash
echo "🔍 DIAGNÓSTICO DE DESPLIEGUE - PERUANA INFORMÁTICA"
echo "=================================================="

echo "📊 Estado de Docker:"
docker --version
docker-compose --version

echo ""
echo "🐳 Contenedores en ejecución:"
docker ps -a

echo ""
echo "📦 Imágenes disponibles:"
docker images | grep peruana

echo ""
echo "🌐 Redes Docker:"
docker network ls

echo ""
echo "💾 Volúmenes:"
docker volume ls

echo ""
echo "📋 Logs de contenedores (últimas 20 líneas):"
echo "--- Backend ---"
docker logs --tail 20 peruana-backend 2>/dev/null || echo "Contenedor backend no encontrado"

echo ""
echo "--- Frontend ---"
docker logs --tail 20 peruana-frontend 2>/dev/null || echo "Contenedor frontend no encontrado"

echo ""
echo "--- Database ---"
docker logs --tail 20 peruana-db 2>/dev/null || echo "Contenedor db no encontrado"

echo ""
echo "--- Redis ---"
docker logs --tail 20 peruana-redis 2>/dev/null || echo "Contenedor redis no encontrado"

echo ""
echo "--- Nginx ---"
docker logs --tail 20 peruana-nginx 2>/dev/null || echo "Contenedor nginx no encontrado"

echo ""
echo "🔍 Verificando conectividad:"
echo "Frontend → Backend:"
docker exec peruana-frontend curl -f http://backend:3001/health 2>/dev/null && echo "✅ OK" || echo "❌ FALLO"

echo "Nginx → Frontend:"
docker exec peruana-nginx curl -f http://frontend:3000 2>/dev/null && echo "✅ OK" || echo "❌ FALLO"

echo "Backend → Database:"
docker exec peruana-backend nc -z db 3306 2>/dev/null && echo "✅ OK" || echo "❌ FALLO"

echo "Backend → Redis:"
docker exec peruana-backend nc -z redis 6379 2>/dev/null && echo "✅ OK" || echo "❌ FALLO"

echo ""
echo "🎯 Diagnóstico completado!"
"@

Set-Content "$PSScriptRoot\diagnostic.sh" $diagnosticScript

Write-Host "   ✅ Script de diagnóstico creado" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 CORRECCIONES COMPLETADAS" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PASOS SIGUIENTES:" -ForegroundColor Yellow
Write-Host "1. Actualiza las contraseñas en .env"
Write-Host "2. Ejecuta: .\deploy.ps1"
Write-Host "3. Si hay errores, conecta al servidor y ejecuta: bash diagnostic.sh"
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Revisa el archivo .env y actualiza las contraseñas antes de desplegar" -ForegroundColor Red
