#!/bin/bash

# ==========================================
# 🚀 Script de Despliegue - Peruana Informática
# ==========================================

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}➡️  Iniciando proceso de despliegue...${NC}"

# 1. Verificar si existe archivo .env
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo .env.production${NC}"
    echo "Por favor, crea el archivo .env.production basado en .env.production.template"
    exit 1
fi

# 2. Copiar .env.production a .env para que docker-compose lo lea por defecto
# 2. Copiar .env.production a .env para que docker-compose lo lea por defecto
cp .env.production .env

# Cargar variables para verificar
set -o allexport
source .env
set +o allexport

echo -e "${BLUE}ℹ️  Configuración detectada para Frontend:${NC}"
echo -e "   NEXT_PUBLIC_API_URL: ${GREEN}${NEXT_PUBLIC_API_URL}${NC}"
echo -e "   (Asegúrate de que esta URL sea accesible desde el navegador del usuario)"


# 3. Descargar cambios (si usas git en el servidor)
# echo -e "${BLUE}⬇️  Actualizando código fuente...${NC}"
# git pull origin main

# Determinar comando de docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

echo -e "${BLUE}ℹ️  Usando comando: $DOCKER_COMPOSE_CMD${NC}"

# 4. Reconstruir los contenedores
echo -e "${BLUE}🏗️  Construyendo imágenes Docker (Optimizado para Producción)...${NC}"
# Forzamos no-cache en frontend para asegurar que las ENV vars se "cocinen" en el build
$DOCKER_COMPOSE_CMD -f docker-compose.production.yml build --no-cache frontend
# Construimos el resto normalmente
$DOCKER_COMPOSE_CMD -f docker-compose.production.yml build backend nginx db redis

# 5. Detener contenedores antiguos
echo -e "${BLUE}🛑 Deteniendo servicios actuales...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.production.yml down

# 6. Iniciar nuevos contenedores en background
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.production.yml up -d

# 7. Verificar estado
echo -e "${BLUE}🔍 Verificando estado de los servicios...${NC}"
sleep 5
$DOCKER_COMPOSE_CMD -f docker-compose.production.yml ps

echo -e "${GREEN}✅ ¡Despliegue completado!${NC}"
echo -e "Visita: http://200.58.98.122"
echo -e "Logs Backend: docker logs -f peruana-backend"
