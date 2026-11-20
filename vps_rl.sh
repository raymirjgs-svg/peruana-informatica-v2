cd /root/projects/peruana-informatica-v2 || exit 1
echo "=== 1) trust proxy en el backend ==="
docker exec peruana_backend sh -c "grep -n 'trust proxy' /app/dist/server.js | head -3"
echo ""
echo "=== 2) el backend registra 429 / RATE_LIMIT? (logs de hoy) ==="
docker logs --since 24h peruana_backend 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -iE "RATE_LIMIT|429|Demasiados intentos|Demasiadas solicitudes" | tail -10
echo "(vacio = no hay 429 registrados)"
echo ""
echo "=== 3) el logger registra los 4xx? (muestra de 401 del login) ==="
docker logs --since 24h peruana_backend 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -iE "POST /api/admin/login" | tail -5
echo "(vacio = el logger no registra el login)"
echo ""
echo "=== 4) conteo de POST /api/admin/login hoy (cuantos llegaron al backend) ==="
docker logs --since 24h peruana_backend 2>&1 | grep -c "POST /api/admin/login" || echo 0
echo ""
echo "=== 5) IP que ve el backend en los requests del login ==="
docker exec peruana_backend sh -c "grep -n 'ip:' /app/dist/middleware/logger.js | head -3"
echo ""
echo "=== 6) nginx: pasa X-Forwarded-For al frontend? ==="
grep -rn "proxy_set_header X-Forwarded-For\|proxy_set_header Host" /etc/nginx/sites-enabled/ 2>/dev/null | head -6
