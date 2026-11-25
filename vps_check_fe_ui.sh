cd /root/projects/peruana-informatica-v2
echo "=== BUILD CORRIENDO? ==="
pgrep -f "docker compose -f docker-compose.prod.yml build frontend" > /dev/null && echo "SI, sigue en curso" || echo "NO, termino"
echo "=== ULTIMAS 20 LINEAS LOG ==="
tail -20 /tmp/build_fe_ui.log
echo "=== IMAGENES ==="
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 'peruana-informatica-v2-frontend'
