#!/bin/bash

# ============================================
# 🚀 DEPLOY SCRIPT - Peruana Informatica
# ============================================

set -e

echo "============================================"
echo "🚀 Iniciando deploy de Peruana Informatica"
echo "============================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Verificar Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}⚠️ Docker Compose plugin no encontrado, verificando docker-compose...${NC}"
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo -e "${GREEN}✅ Docker y Docker Compose disponibles${NC}"

# Verificar archivo de entorno
if [ ! -f "envs/.env.production" ]; then
    echo -e "${RED}❌ No existe envs/.env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo de entorno encontrado${NC}"

# Detener contenedores existentes
echo -e "${YELLOW}⏳ Deteniendo contenedores existentes...${NC}"
$COMPOSE_CMD -f docker-compose.vps.yml down 2>/dev/null || true

# Limpiar imágenes antiguas
echo -e "${YELLOW}⏳ Limpiando imágenes antiguas...${NC}"
docker system prune -f

# Construir y levantar
echo -e "${YELLOW}⏳ Construyendo imágenes...${NC}"
$COMPOSE_CMD -f docker-compose.vps.yml build --no-cache

echo -e "${YELLOW}⏳ Iniciando servicios...${NC}"
$COMPOSE_CMD -f docker-compose.vps.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando que los servicios estén listos...${NC}"
sleep 30

# Verificar estado
echo ""
echo "============================================"
echo "📊 Estado de los servicios:"
echo "============================================"
$COMPOSE_CMD -f docker-compose.vps.yml ps

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deploy completado!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "🌐 La aplicación está disponible en:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     $COMPOSE_CMD -f docker-compose.vps.yml logs -f"
echo "   Reiniciar:    $COMPOSE_CMD -f docker-compose.vps.yml restart"
echo "   Detener:      $COMPOSE_CMD -f docker-compose.vps.yml down"
echo ""
