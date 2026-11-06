#!/bin/bash
# Script para revisar el servidor remoto

echo "=== ESTADO DEL SERVIDOR ==="
docker ps -a

echo ""
echo "=== IMÁGENES DOCKER ==="
docker images

echo ""
echo "=== VOLÚMENES ==="
docker volume ls

echo ""
echo "=== CARPETAS PRINCIPALES ==="
ls -la /home/ 2>/dev/null || ls -la /root/ | head -20

echo ""
echo "=== DOCKER COMPOSE ARCHIVOS ==="
find / -name "docker-compose*.yml" 2>/dev/null | head -10

echo ""
echo "=== LOGS RECIENTES ==="
docker logs peruana-backend 2>/dev/null | tail -20
