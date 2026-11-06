#!/bin/bash

# ============================================
# 🚀 SCRIPT DE DESPLIEGUE CON SSH INTEGRADO
# ============================================
# Este script incluye las credenciales SSH configuradas
# ============================================

set -e

# Configuración SSH
SERVER_IP="200.58.98.122"
SERVER_PORT="5313"
SSH_USER="root"
SSH_PASSWORD="9wC8/5lAhlxrXd"
REMOTE_DIR="/root/peruana-informatica"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando despliegue automático en producción${NC}"
echo -e "${BLUE}📍 Servidor: ${SERVER_IP}:${SERVER_PORT}${NC}"

# ============================================
# 1. Función para ejecutar comandos SSH
# ============================================
ssh_exec() {
    local cmd="$1"
    echo -e "${YELLOW}🔧 Ejecutando: ${cmd}${NC}"
    sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "${cmd}"
}

# ============================================
# 2. Verificar variables de entorno locales
# ============================================
echo -e "${YELLOW}📋 Verificando configuración local...${NC}"

if [ ! -f "envs/.env.production" ]; then
    echo -e "${RED}❌ Error: No existe envs/.env.production${NC}"
    exit 1
fi

# Verificar que las contraseñas placeholder estén cambiadas
if grep -q "CAMBIAR_ESTO" envs/.env.production; then
    echo -e "${RED}❌ Error: Debes cambiar las contraseñas placeholder en envs/.env.production${NC}"
    echo -e "${YELLOW}💡 Edita el archivo y reemplaza: CAMBIAR_ESTO${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuración local validada${NC}"

# ============================================
# 3. Instalar sshpass si no está disponible
# ============================================
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando sshpass...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Para Ubuntu/Debian
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Para macOS con Homebrew
        brew install hudochenkov/sshpass/sshpass
    fi
fi

# ============================================
# 4. Preparación del servidor
# ============================================
echo -e "${YELLOW}🔧 Preparando servidor remoto...${NC}"

ssh_exec "mkdir -p ${REMOTE_DIR}"
ssh_exec "cd ${REMOTE_DIR} && mkdir -p backups nginx/conf.d certbot/conf certbot/www"

# Instalar Docker si no está instalado
ssh_exec "
if ! command -v docker &> /dev/null; then
    echo '📦 Instalando Docker...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi
"

# Instalar Docker Compose si no está instalado
ssh_exec "
if ! command -v docker compose &> /dev/null; then
    echo '📦 Instalando Docker Compose...'
    curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi
"

# ============================================
# 5. Subida de archivos al servidor
# ============================================
echo -e "${YELLOW}📤 Subiendo archivos al servidor...${NC}"

# Subir archivos críticos usando scp con contraseña
echo -e "${BLUE}📁 Subiendo archivos principales...${NC}"
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} docker-compose.prod.yml ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} envs/.env.production ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/envs/.env.production
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} nginx/nginx.conf ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/nginx/nginx.conf

# Subir Dockerfiles
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} peruana-informatica/backend/Dockerfile.prod ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/backend-dockerfile.prod
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} peruana-informatica/frontend/Dockerfile.prod ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/frontend-dockerfile.prod

# Subir código fuente (usando tar para eficiencia)
echo -e "${BLUE}📦 Subiendo código fuente...${NC}"
tar -czf - peruana-informatica/ --exclude=node_modules --exclude=dist --exclude=.next --exclude=.git | \
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && tar -xzf -"

# Subir scripts
tar -czf - scripts/ | \
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && tar -xzf -"

# ============================================
# 6. Despliegue en el servidor
# ============================================
echo -e "${YELLOW}🚀 Iniciando despliegue en servidor...${NC}"

ssh_exec "
cd ${REMOTE_DIR}

# Verificar archivos críticos
if [ ! -f 'docker-compose.prod.yml' ]; then
    echo '❌ Error: No existe docker-compose.prod.yml'
    exit 1
fi

if [ ! -f 'envs/.env.production' ]; then
    echo '❌ Error: No existe envs/.env.production'
    exit 1
fi

# Detener contenedores antiguos
echo '🧹 Deteniendo contenedores antiguos...'
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Construir y levantar contenedores
echo '🔨 Construyendo imágenes...'
docker compose -f docker-compose.prod.yml build --no-cache

echo '🚀 Iniciando contenedores...'
docker compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén saludables
echo '⏳ Esperando que los servicios inicien...'
sleep 30

# Verificar estado
echo '📊 Verificando estado de contenedores:'
docker compose -f docker-compose.prod.yml ps

# Verificar health checks
echo '🏥 Verificando health checks...'

# Backend health
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo '✅ Backend saludable'
        break
    else
        echo "⏳ Esperando backend (\$i/10)..."
        sleep 10
    fi
done

# Frontend health
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo '✅ Frontend saludable'
        break
    else
        echo "⏳ Esperando frontend (\$i/10)..."
        sleep 10
    fi
done

echo '🔍 Mostrando logs recientes...'
docker compose -f docker-compose.prod.yml logs --tail=20
"

# ============================================
# 7. Verificación final
# ============================================
echo -e "${YELLOW}🔍 Verificación final...${NC}"

echo -e "${BLUE}🌐 Probando acceso desde local...${NC}"

# Test de API
if curl -f http://${SERVER_IP}:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API accesible desde local: http://${SERVER_IP}:3001/api${NC}"
else
    echo -e "${YELLOW}⚠️ API no accesible desde local (puede ser firewall)${NC}"
fi

# Test de frontend
if curl -f http://${SERVER_IP}:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accesible desde local: http://${SERVER_IP}:3000${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend no accesible desde local (puede ser firewall)${NC}"
fi

echo -e "${GREEN}🎉 Despliegue completado con éxito!${NC}"
echo -e "${BLUE}📱 Aplicación disponible en: http://${SERVER_IP}:3000${NC}"
echo -e "${BLUE}🔧 API disponible en: http://${SERVER_IP}:3001/api${NC}"