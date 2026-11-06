#!/bin/bash

# Script para verificar la estructura de la base de datos
# Verifica que todas las tablas esperadas existan

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="peruana-informatica_v2-mysql-1"
DB_NAME="peruanainformatica"

if [ -f .env ]; then
    source .env
fi

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword123}

echo -e "${YELLOW}=== Verificación de Estructura de Base de Datos ===${NC}"
echo ""

# Tablas esperadas
EXPECTED_TABLES=(
    "attributes"
    "attribute_values"
    "blog_comments"
    "blog_posts"
    "blog_title_suggestions"
    "brands"
    "carousel"
    "carts"
    "cart_items"
    "categories"
    "company_settings"
    "compatibility_rules"
    "contacts"
    "img_products"
    "orders"
    "order_items"
    "pages"
    "products"
    "product_attributes"
    "product_sub_categories"
    "promo_banners"
    "quotations"
    "quotation_items"
    "reviews"
    "seo_settings"
    "settings"
    "sub_categories"
    "users"
    "wishlists"
)

# Obtener tablas existentes
EXISTING_TABLES=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SHOW TABLES;")

echo "Verificando tablas..."
echo ""

MISSING=0
FOUND=0

for table in "${EXPECTED_TABLES[@]}"; do
    if echo "$EXISTING_TABLES" | grep -q "^$table$"; then
        echo -e "${GREEN}✓${NC} $table"
        ((FOUND++))
    else
        echo -e "${RED}✗${NC} $table (FALTANTE)"
        ((MISSING++))
    fi
done

echo ""
echo "================================"
echo "Tablas encontradas: $FOUND/28"
echo "Tablas faltantes: $MISSING"
echo "================================"

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ Todas las tablas están presentes${NC}"
    exit 0
else
    echo -e "${RED}✗ Faltan $MISSING tablas${NC}"
    exit 1
fi
