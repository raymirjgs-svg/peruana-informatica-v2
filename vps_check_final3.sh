cd /root/projects/peruana-informatica-v2
echo "=== BUILD CORRIENDO? ==="
pgrep -f "docker compose -f docker-compose.prod.yml build frontend" > /dev/null && echo "SI" || echo "NO (termino)"
echo "=== ULTIMAS LINEAS LOG ==="
tail -15 /tmp/build_fe_final2.log
echo "=== IMAGENES ==="
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 'peruana-informatica-v2-frontend'