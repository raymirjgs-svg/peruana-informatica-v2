#!/bin/bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-peruana-local-db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
DB_NAME="${DB_NAME:-peruana_informatica}"
BACKUP_DIR="${BACKUP_DIR:-../backups/db}"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TMP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
FINAL_FILE="$TMP_FILE"

mkdir -p "$BACKUP_DIR"

if ! docker ps -q -f "name=$CONTAINER_NAME" | grep -q .; then
    echo "⚠️ Container $CONTAINER_NAME is not running."
    exit 1
fi

echo "📦 Creating backup of $DB_NAME..."

if ! docker exec -e MYSQL_PWD="$DB_PASSWORD" "$CONTAINER_NAME" \
    mysqldump -u "$DB_USER" --single-transaction --quick --no-tablespaces "$DB_NAME" | gzip > "$TMP_FILE"; then
    rm -f "$TMP_FILE"
    echo "❌ Error creating backup."
    exit 1
fi

if ! gzip -t "$TMP_FILE"; then
    rm -f "$TMP_FILE"
    echo "❌ Backup archive is corrupted."
    exit 1
fi

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
    openssl enc -aes-256-cbc -pbkdf2 -salt \
        -pass env:BACKUP_PASSPHRASE \
        -in "$TMP_FILE" -out "$TMP_FILE.enc"
    rm -f "$TMP_FILE"
    FINAL_FILE="$TMP_FILE.enc"
fi

echo "✅ Backup created successfully: $FINAL_FILE"
