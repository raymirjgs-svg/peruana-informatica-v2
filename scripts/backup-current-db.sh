#!/bin/bash

# Script para hacer backup de la base de datos actual
# Autor: Peruana Informática
# Fecha: $(date +%Y-%m-%d)

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="peruana-informatica_v2-mysql-1"
DB_NAME="peruanainformatica"

# Variables de entorno (cargar desde .env si existe)
if [ -f .env ]; then
    source .env
fi

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword123}

echo -e "${YELLOW}=== Backup de Base de Datos ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Contenedor: $CONTAINER_NAME"
echo "Base de datos: $DB_NAME"
echo ""

# Crear directorio de backups si no existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creando directorio de backups...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Verificar que el contenedor esté corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}ERROR: El contenedor MySQL no está corriendo${NC}"
    echo "Iniciando contenedores con docker-compose up -d..."
    docker-compose up -d mysql
    sleep 10
fi

# Hacer backup de la base de datos
echo -e "${YELLOW}Creando backup SQL...${NC}"
BACKUP_FILE="$BACKUP_DIR/peruana_informatica_backup_$TIMESTAMP.sql"

docker exec "$CONTAINER_NAME" mysqldump \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup SQL creado exitosamente${NC}"
    echo "Archivo: $BACKUP_FILE"
    echo "Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}✗ Error al crear backup SQL${NC}"
    exit 1
fi

# Comprimir el backup
echo -e "${YELLOW}Comprimiendo backup...${NC}"
gzip "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup comprimido exitosamente${NC}"
    echo "Archivo: ${BACKUP_FILE}.gz"
    echo "Tamaño: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
else
    echo -e "${RED}✗ Error al comprimir backup${NC}"
    exit 1
fi

# Backup del volumen de MySQL (opcional, más completo pero más pesado)
echo ""
echo -e "${YELLOW}¿Deseas hacer backup del volumen completo de MySQL? (más lento pero más seguro)${NC}"
echo "Esto creará una copia exacta del directorio de datos de MySQL"
read -p "Continuar? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    VOLUME_BACKUP="$BACKUP_DIR/mysql_volume_$TIMESTAMP.tar.gz"
    
    echo -e "${YELLOW}Creando backup del volumen...${NC}"
    docker run --rm \
        -v peruana-informatica_v2_mysql_data:/var/lib/mysql:ro \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine \
        tar czf "/backup/mysql_volume_$TIMESTAMP.tar.gz" -C /var/lib/mysql .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup del volumen creado exitosamente${NC}"
        echo "Archivo: $VOLUME_BACKUP"
        echo "Tamaño: $(du -h "$VOLUME_BACKUP" | cut -f1)"
    else
        echo -e "${RED}✗ Error al crear backup del volumen${NC}"
    fi
fi

# Resumen
echo ""
echo -e "${GREEN}=== Backup Completado ===${NC}"
echo "Archivos creados en: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | grep "$TIMESTAMP"

echo ""
echo -e "${YELLOW}Importante:${NC}"
echo "- Guarda estos backups en un lugar seguro"
echo "- Puedes restaurar con: gunzip -c archivo.sql.gz | docker exec -i $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD $DB_NAME"
echo ""
