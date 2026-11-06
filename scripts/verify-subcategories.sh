#!/bin/bash

# Script para verificar subcategorías
# Verifica las relaciones producto-subcategoría

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

echo -e "${YELLOW}=== Verificación de Subcategorías ===${NC}"
echo ""

# Total de subcategorías
SUB_CAT_COUNT=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM sub_categories;")

echo -e "${BLUE}Subcategorías Disponibles:${NC}"
echo "Total: $SUB_CAT_COUNT"
echo ""

# Relaciones producto-subcategoría
RELATIONS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM product_sub_categories;")

echo -e "${BLUE}Relaciones Producto-Subcategoría:${NC}"
echo "Total de relaciones: $RELATIONS"

if [ "$RELATIONS" -gt 0 ]; then
    echo -e "${GREEN}✓ Hay relaciones producto-subcategoría configuradas${NC}"
else
    echo -e "${RED}✗ No hay relaciones producto-subcategoría${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Top 10 Subcategorías más Usadas:${NC}"
echo "─────────────────────────────────────────────"

docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -e "
    SELECT 
        sc.name as 'Subcategoría',
        c.name as 'Categoría Principal',
        COUNT(psc.product_id) as 'Productos'
    FROM sub_categories sc
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN product_sub_categories psc ON sc.id = psc.sub_category_id
    GROUP BY sc.id, sc.name, c.name
    ORDER BY COUNT(psc.product_id) DESC
    LIMIT 10;
" | column -t

echo ""

# Productos con múltiples subcategorías
MULTI_SUBCAT=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "
    SELECT COUNT(*) 
    FROM (
        SELECT product_id, COUNT(*) as cnt
        FROM product_sub_categories
        GROUP BY product_id
        HAVING cnt > 1
    ) as multi;
")

echo -e "${BLUE}Productos con Múltiples Subcategorías:${NC}"
echo "Cantidad: $MULTI_SUBCAT"

if [ "$MULTI_SUBCAT" -gt 0 ]; then
    echo -e "${GREEN}✓ Hay productos con múltiples subcategorías${NC}"
fi

echo ""
echo -e "${GREEN}=== Verificación Completada ===${NC}"
