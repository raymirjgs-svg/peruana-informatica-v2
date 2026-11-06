#!/bin/sh

# Configuración
BACKUP_DIR="/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

echo "[INFO] Iniciando Demonio de Backup..."
echo "[INFO] Retención configurada en: $RETENTION_DAYS días"

while true; do
    echo "------------------------------------------------"
    echo "[STARTED] Backup iniciado: $DATE"
    
    # 1. Backup de Base de Datos (Stream comprimido)
    # Usamos las variables de entorno inyectadas por Docker (DB_HOST, MYSQL_USER, MYSQL_PASSWORD)
    if mysqldump -h "$DB_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"; then
        echo "[SUCCESS] Base de datos respaldada: db_$DATE.sql.gz"
    else
        echo "[ERROR] Falló el backup de base de datos"
    fi

    # 2. Backup de Uploads (Imágenes)
    if tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /app/public uploads; then
        echo "[SUCCESS] Archivos subidos respaldados: uploads_$DATE.tar.gz"
    else
        echo "[ERROR] Falló el backup de uploads"
    fi

    # 3. Política de Retención (Limpieza)
    echo "[CLEANUP] Eliminando backups antiguos (> $RETENTION_DAYS días)..."
    find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "[FINISHED] Proceso completado. Durmiendo 24 horas..."
    echo "------------------------------------------------"

    # Esperar 24 horas (86400 segundos) antes del siguiente backup
    sleep 86400
    
    # Actualizar fecha para el siguiente loop
    DATE=$(date +%Y%m%d_%H%M%S)
done
