#!/bin/sh
set -u

BACKUP_DIR="/backups"
RETENTION_DAYS=7

echo "[INFO] Iniciando Demonio de Backup..."
echo "[INFO] Retención configurada en: $RETENTION_DAYS días"

encrypt_if_configured() {
    input="$1"
    if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
        if openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -in "$input" -out "$input.enc"; then
            rm -f "$input"
            echo "$input.enc"
            return 0
        fi
        echo "[ERROR] Falló el cifrado de $input" >&2
        return 1
    fi
    echo "$input"
}

while true; do
    DATE=$(date +%Y%m%d_%H%M%S)
    echo "------------------------------------------------"
    echo "[STARTED] Backup iniciado: $DATE"

    DB_FILE="$BACKUP_DIR/db_$DATE.sql.gz"
    if MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -h "$DB_HOST" -u "$MYSQL_USER" --single-transaction --quick "$MYSQL_DATABASE" | gzip > "$DB_FILE"; then
        DB_FINAL=$(encrypt_if_configured "$DB_FILE") || DB_FINAL=""
        echo "[SUCCESS] Base de datos respaldada: ${DB_FINAL:-$DB_FILE}"
    else
        rm -f "$DB_FILE"
        echo "[ERROR] Falló el backup de base de datos"
    fi

    UPLOADS_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"
    if tar -czf "$UPLOADS_FILE" -C /app/public uploads; then
        UPLOADS_FINAL=$(encrypt_if_configured "$UPLOADS_FILE") || UPLOADS_FINAL=""
        echo "[SUCCESS] Archivos subidos respaldados: ${UPLOADS_FINAL:-$UPLOADS_FILE}"
    else
        rm -f "$UPLOADS_FILE"
        echo "[ERROR] Falló el backup de uploads"
    fi

    echo "[CLEANUP] Eliminando backups antiguos (> $RETENTION_DAYS días)..."
    find "$BACKUP_DIR" -name "db_*.sql.gz*" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "uploads_*.tar.gz*" -mtime +$RETENTION_DAYS -delete

    echo "[FINISHED] Proceso completado. Durmiendo 24 horas..."
    echo "------------------------------------------------"

    sleep 86400
done
