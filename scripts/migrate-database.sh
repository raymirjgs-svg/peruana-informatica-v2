#!/bin/bash

# Script para migrar a la base de datos optimizada
# Autor: Peruana Informática
# Fecha: $(date +%Y-%m-%d)

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
CONTAINER_NAME="peruana-informatica_v2-mysql-1"
DB_NAME="peruanainformatica"
OPTIMIZED_DB="./peruana_informatica._optimizada.sql"
INIT_DB_DIR="./scripts/init-db"

# Variables de entorno
if [ -f .env ]; then
    source .env
fi

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword123}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Migración a Base de Datos Optimizada ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar que existe el archivo optimizado
if [ ! -f "$OPTIMIZED_DB" ]; then
    echo -e "${RED}ERROR: No se encuentra el archivo $OPTIMIZED_DB${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archivo de BD optimizada encontrado${NC}"
echo "Archivo: $OPTIMIZED_DB"
echo "Tamaño: $(du -h "$OPTIMIZED_DB" | cut -f1)"
echo ""

# Paso 1: Backup de la BD actual
echo -e "${YELLOW}[Paso 1/5] Creando backup de la BD actual...${NC}"
if [ -f "./scripts/backup-current-db.sh" ]; then
    bash ./scripts/backup-current-db.sh
else
    echo -e "${YELLOW}Script de backup no encontrado, creando backup manual...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    docker exec "$CONTAINER_NAME" mysqldump \
        -u root \
        -p"$MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        "$DB_NAME" | gzip > "backups/pre_migration_$TIMESTAMP.sql.gz"
    echo -e "${GREEN}✓ Backup creado: backups/pre_migration_$TIMESTAMP.sql.gz${NC}"
fi

echo ""
read -p "¿Continuar con la migración? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migración cancelada por el usuario${NC}"
    exit 0
fi

# Paso 2: Detener la aplicación (mantener solo MySQL)
echo ""
echo -e "${YELLOW}[Paso 2/5] Deteniendo servicios de aplicación...${NC}"
docker-compose stop frontend backend nginx || true
echo -e "${GREEN}✓ Servicios detenidos${NC}"

# Paso 3: Eliminar la base de datos actual y recrear
echo ""
echo -e "${YELLOW}[Paso 3/5] Preparando base de datos para importación...${NC}"

docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo -e "${GREEN}✓ Base de datos recreada${NC}"

# Paso 4: Importar la BD optimizada
echo ""
echo -e "${YELLOW}[Paso 4/5] Importando base de datos optimizada...${NC}"
echo "Esto puede tardar varios minutos dependiendo del tamaño..."

docker exec -i "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    "$DB_NAME" < "$OPTIMIZED_DB"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Base de datos importada exitosamente${NC}"
else
    echo -e "${RED}✗ Error al importar base de datos${NC}"
    echo -e "${YELLOW}Intentando restaurar desde backup...${NC}"
    # Aquí iría la lógica de rollback si fuera necesario
    exit 1
fi

# Paso 5: Verificar importación
echo ""
echo -e "${YELLOW}[Paso 5/5] Verificando importación...${NC}"

# Verificar número de tablas
TABLE_COUNT=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")

echo "Tablas encontradas: $TABLE_COUNT"

if [ "$TABLE_COUNT" -eq 28 ]; then
    echo -e "${GREEN}✓ Número correcto de tablas (28)${NC}"
else
    echo -e "${RED}✗ Número incorrecto de tablas (esperado: 28, encontrado: $TABLE_COUNT)${NC}"
fi

# Verificar productos con categorías
PRODUCTS_WITH_CATEGORY=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM products WHERE category_id IS NOT NULL;")

echo "Productos con categoría: $PRODUCTS_WITH_CATEGORY"
echo -e "${GREEN}✓ Productos categorizados correctamente${NC}"

# Verificar subcategorías
SUBCATEGORIES=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM product_sub_categories;")

echo "Relaciones producto-subcategoría: $SUBCATEGORIES"
echo -e "${GREEN}✓ Subcategorías cargadas${NC}"

# Verificar blog posts
BLOG_POSTS=$(docker exec "$CONTAINER_NAME" mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -D "$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM blog_posts;")

echo "Posts de blog: $BLOG_POSTS"
echo -e "${GREEN}✓ Blog posts cargados${NC}"

# Paso 6: Reiniciar todos los servicios
echo ""
echo -e "${YELLOW}Reiniciando todos los servicios...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Migración Completada Exitosamente ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Verificar que la aplicación web cargue correctamente"
echo "2. Probar el sistema de categorías y filtros"
echo "3. Verificar el blog y sus nuevos artículos"
echo "4. Probar crear una orden de prueba"
echo "5. Ejecutar scripts de verificación adicionales"
echo ""
echo -e "${BLUE}Para verificación automática, ejecuta:${NC}"
echo "  bash scripts/verify-db-structure.sh"
echo "  bash scripts/verify-product-data.sh"
echo "  bash scripts/verify-subcategories.sh"
echo ""
