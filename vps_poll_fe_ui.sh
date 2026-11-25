cd /root/projects/peruana-informatica-v2
for i in $(seq 1 40); do
  if docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep -q 'peruana-informatica-v2-frontend:latest.*Less than a minute\|peruana-informatica-v2-frontend:latest.*seconds ago'; then
    echo "BUILD DONE"
    break
  fi
  if ! pgrep -f "docker compose -f docker-compose.prod.yml build frontend" > /dev/null; then
    echo "BUILD PROCESS FINISHED (o fallo)"
    break
  fi
  sleep 15
done
echo "=== ULTIMAS LINEAS DEL LOG ==="
tail -25 /tmp/build_fe_ui.log
echo "=== IMAGENES ==="
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 'peruana-informatica-v2-frontend'
