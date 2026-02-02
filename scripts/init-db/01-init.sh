#!/bin/bash
# ============================================
# 🚀 MySQL Initialization Script for Docker
# ============================================
# This script runs automatically when MySQL
# container starts for the FIRST TIME ONLY
# ============================================

set -e

echo "============================================"
echo "🚀 Starting MySQL Initialization"
echo "============================================"

# Database name from environment variable
DB_NAME="${MYSQL_DATABASE:-peruana_informatica}"
DB_USER="${MYSQL_USER:-peruana_user}"

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"

# Create database if not exists
echo "📝 Creating database if not exists..."
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
    FLUSH PRIVILEGES;
EOSQL

echo "✅ Database created successfully"

# Check if SQL backup file exists
SQL_FILE="/docker-entrypoint-initdb.d/peruana_informatica.sql"

if [ -f "$SQL_FILE" ]; then
    echo "📥 Found SQL backup file: peruana_informatica.sql"
    echo "🔄 Importing database..."
    
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${DB_NAME}" < "$SQL_FILE"
    
    echo "✅ Database imported successfully"
else
    echo "⚠️  No SQL backup file found at: $SQL_FILE"
    echo "ℹ️  Starting with empty database"
    echo "ℹ️  Sequelize will create tables automatically on backend startup"
fi

echo "============================================"
echo "✅ MySQL Initialization Complete"
echo "============================================"
