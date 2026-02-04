#!/bin/bash

# Configuration
CONTAINER_NAME="peruana-local-db"
DB_USER="root"
DB_PASSWORD="rootpassword"
DB_NAME="peruana_informatica"
BACKUP_DIR="../backups/db"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "📦 Creating backup of $DB_NAME..."
    
    # Execute dump
    docker exec $CONTAINER_NAME mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/$FILENAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup created successfully: $BACKUP_DIR/$FILENAME"
        
        # Optional: Remove backups older than 7 days
        # find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -exec rm {} \;
    else
        echo "❌ Error creating backup."
    fi
else
    echo "⚠️ Container $CONTAINER_NAME is not running."
fi
