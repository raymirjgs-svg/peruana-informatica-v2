#!/bin/bash

# Script para verificar blog posts
# Verifica que los nuevos posts estén presentes

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="peruana-informatica_v2-mysql-1"
DB_NAME="peruanainformatica"

if [ -f .env ]; then
    source .env
fi

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword123}

echo -e "${YELLOW}=== Verificación de Blog Posts ===${NC}"
echo ""

# Total de posts
TOTAL_POSTS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM blog_posts;")

echo -e "${BLUE}Total de Posts:${NC} $TOTAL_POSTS"
echo ""

# Posts generados por IA
AI_POSTS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM blog_posts WHERE ai_generated = 1;")

echo -e "${BLUE}Posts Generados por IA:${NC} $AI_POSTS"
echo ""

# Verificar posts específicos (IDs 16-24)
echo -e "${BLUE}Nuevos Posts (16-24):${NC}"
echo "─────────────────────────────────────────────────────────────"

docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -e "
    SELECT 
        id as 'ID',
        title as 'Título',
        status as 'Estado',
        ai_generated as 'IA',
        views as 'Vistas',
        reading_time as 'Min'
    FROM blog_posts 
    WHERE id BETWEEN 16 AND 24
    ORDER BY id;
" | column -t

echo ""

# Estadísticas por estado
echo -e "${BLUE}Posts por Estado:${NC}"
echo "─────────────────────────────────────"

docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -e "
    SELECT 
        status as 'Estado',
        COUNT(*) as 'Cantidad'
    FROM blog_posts
    GROUP BY status;
" | column -t

echo ""

# Palabras totales
TOTAL_WORDS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT SUM(word_count) FROM blog_posts;")

echo -e "${BLUE}Total de Palabras en el Blog:${NC} $TOTAL_WORDS"

# Verificar imágenes destacadas
POSTS_WITH_IMAGES=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM blog_posts WHERE featured_image IS NOT NULL;")

echo -e "${BLUE}Posts con Imagen Destacada:${NC} $POSTS_WITH_IMAGES"

echo ""

if [ "$AI_POSTS" -ge 9 ]; then
    echo -e "${GREEN}✓ Los nuevos posts de blog están presentes${NC}"
else
    echo -e "${YELLOW}⚠ Algunos posts pueden estar faltando${NC}"
fi

echo ""
echo -e "${GREEN}=== Verificación Completada ===${NC}"
