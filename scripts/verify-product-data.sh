#!/bin/bash

# Script para verificar datos de productos
# Verifica que los productos tengan categorías asignadas

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

echo -e "${YELLOW}=== Verificación de Datos de Productos ===${NC}"
echo ""

# Query para obtener estadísticas de productos
STATS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END) as with_category,
        SUM(CASE WHEN category_id IS NULL THEN 1 ELSE 0 END) as without_category,
        COUNT(DISTINCT category_id) as unique_categories
    FROM products;
")

# Parsear resultados
TOTAL=$(echo $STATS | awk '{print $1}')
WITH_CATEGORY=$(echo $STATS | awk '{print $2}')
WITHOUT_CATEGORY=$(echo $STATS | awk '{print $3}')
UNIQUE_CATEGORIES=$(echo $STATS | awk '{print $4}')

echo -e "${BLUE}Estadísticas de Productos:${NC}"
echo "─────────────────────────────────────"
echo "Total de productos: $TOTAL"
echo "Con categoría: $WITH_CATEGORY"
echo "Sin categoría: $WITHOUT_CATEGORY"
echo "Categorías únicas: $UNIQUE_CATEGORIES"
echo ""

# Calcular porcentaje
if [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$((WITH_CATEGORY * 100 / TOTAL))
    echo "Porcentaje categorizado: ${PERCENTAGE}%"
    
    if [ $PERCENTAGE -eq 100 ]; then
        echo -e "${GREEN}✓ Todos los productos tienen categoría asignada${NC}"
    elif [ $PERCENTAGE -ge 90 ]; then
        echo -e "${YELLOW}⚠ La mayoría de productos tienen categoría (${PERCENTAGE}%)${NC}"
    else
        echo -e "${RED}✗ Muchos productos sin categoría (${WITHOUT_CATEGORY})${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Distribución por Categoría:${NC}"
echo "─────────────────────────────────────"

docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -e "
    SELECT 
        c.name as 'Categoría',
        COUNT(p.id) as 'Cantidad de Productos'
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id, c.name
    ORDER BY COUNT(p.id) DESC;
" | column -t

echo ""

# Verificar imágenes de productos
IMG_COUNT=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM img_products;")

echo -e "${BLUE}Imágenes de Productos:${NC}"
echo "─────────────────────────────────────"
echo "Total de imágenes: $IMG_COUNT"

if [ "$IMG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Hay imágenes de productos cargadas${NC}"
else
    echo -e "${YELLOW}⚠ No hay imágenes de productos${NC}"
fi

echo ""
echo -e "${GREEN}=== Verificación Completada ===${NC}"
