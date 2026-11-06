#!/bin/bash

# ============================================
# 🚀 Script de Despliegue para Producción
# ============================================
# Uso: ./deploy-production.sh [SERVER_IP]
# Ejemplo: ./deploy-production.sh 200.58.98.122
# ============================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SERVER_IP=${1:-"200.58.98.122"}
PROJECT_NAME="peruana-informatica"
REMOTE_DIR="/root/${PROJECT_NAME}"

echo -e "${BLUE}🚀 Iniciando despliegue para producción en ${SERVER_IP}${NC}"

# ============================================
# 1. VALIDACIONES LOCALES
# ============================================
echo -e "${YELLOW}📋 Validando configuración local...${NC}"

# Verificar que existe .env.production
if [ ! -f "envs/.env.production" ]; then
    echo -e "${RED}❌ Error: No existe envs/.env.production${NC}"
    exit 1
fi

# Verificar variables críticas
source envs/.env.production

if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ "$MYSQL_ROOT_PASSWORD" = "CAMBIAR_ESTO" ]; then
    echo -e "${RED}❌ Error: Debes configurar MYSQL_ROOT_PASSWORD en envs/.env.production${NC}"
    exit 1
fi

if [ -z "$MYSQL_PASSWORD" ] || [ "$MYSQL_PASSWORD" = "CAMBIAR_ESTO" ]; then
    echo -e "${RED}❌ Error: Debes configurar MYSQL_PASSWORD en envs/.env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuración local validada${NC}"

# ============================================
# 2. CONEXIÓN SSH AL SERVIDOR
# ============================================
echo -e "${YELLOW}🔗 Conectando al servidor ${SERVER_IP}...${NC}"

# Test de conexión SSH
if ! ssh root@${SERVER_IP} "echo 'Conexión SSH exitosa'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar por SSH al servidor ${SERVER_IP}${NC}"
    echo -e "${YELLOW}💡 Asegúrate de tener configurado el acceso SSH sin contraseña${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Conexión SSH establecida${NC}"

# ============================================
# 3. PREPARACIÓN DEL SERVIDOR
# ============================================
echo -e "${YELLOW}🔧 Preparando servidor...${NC}"

ssh root@${SERVER_IP} << EOF
    # Crear directorio del proyecto si no existe
    mkdir -p ${REMOTE_DIR}
    cd ${REMOTE_DIR}
    
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
    cd ${REMOTE_DIR}
    docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    echo "✅ Servidor preparado"
EOF

echo -e "${GREEN}✅ Servidor preparado${NC}"

# ============================================
# 4. SUBIDA DE ARCHIVOS
# ============================================
echo -e "${YELLOW}📤 Subiendo archivos al servidor...${NC}"

# Crear archivo temporal con IP configurada
sed "s/200.58.98.122/${SERVER_IP}/g" envs/.env.production > /tmp/.env.production.temp

# Subir archivos críticos
scp -q \
    docker-compose.prod.yml \
    /tmp/.env.production.temp \
    nginx/nginx.conf \
    peruana-informatica/backend/Dockerfile.prod \
    peruana-informatica/frontend/Dockerfile.prod \
    root@${SERVER_IP}:${REMOTE_DIR}/

# Subir código fuente (optimizado)
echo "📦 Subiendo código fuente..."
ssh root@${SERVER_IP} << EOF
    cd ${REMOTE_DIR}
    
    # Crear estructura de directorios del código
    mkdir -p peruana-informatica/{backend,frontend}
    
    # Subir backend (excluyendo node_modules y dist)
    echo "📤 Subiendo backend..."
    rsync -avz --exclude node_modules --exclude dist --exclude .git \
        peruana-informatica/backend/ root@${SERVER_IP}:${REMOTE_DIR}/peruana-informatica/backend/
    
    # Subir frontend (excluyendo node_modules y .next)
    echo "📤 Subiendo frontend..."
    rsync -avz --exclude node_modules --exclude .next --exclude .git \
        peruana-informatica/frontend/ root@${SERVER_IP}:${REMOTE_DIR}/peruana-informatica/frontend/
    
    # Subir scripts y configuraciones
    rsync -avz scripts/ root@${SERVER_IP}:${REMOTE_DIR}/scripts/
EOF

# Mover el archivo de entorno temporal
ssh root@${SERVER_IP} "mv /tmp/.env.production.temp ${REMOTE_DIR}/envs/.env.production"

echo -e "${GREEN}✅ Archivos subidos${NC}"

# ============================================
# 5. DESPLIEGUE EN EL SERVIDOR
# ============================================
echo -e "${YELLOW}🚀 Iniciando despliegue en servidor...${NC}"

ssh root@${SERVER_IP} << EOF
    cd ${REMOTE_DIR}
    
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
EOF

echo -e "${GREEN}✅ Despliegue completado${NC}"

# ============================================
# 6. VERIFICACIÓN FINAL
# ============================================
echo -e "${YELLOW}🔍 Verificación final...${NC}"

# Probar conexión desde local
echo "🌐 Probando acceso desde local..."

# Test de API
if curl -f http://${SERVER_IP}:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API accesible desde local${NC}"
else
    echo -e "${YELLOW}⚠️ API no accesible desde local (puede ser firewall)${NC}"
fi

# Test de frontend
if curl -f http://${SERVER_IP}:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accesible desde local${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend no accesible desde local (puede ser firewall)${NC}"
fi

echo -e "${BLUE}🎉 Despliegue finalizado!${NC}"
echo -e "${BLUE}📱 Aplicación disponible en: http://${SERVER_IP}:3000${NC}"
echo -e "${BLUE}🔧 API disponible en: http://${SERVER_IP}:3001/api${NC}"
echo -e "${YELLOW}💡 No olvides configurar SSL y dominio cuando esté listo${NC}"