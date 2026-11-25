cd /root/projects/peruana-informatica-v2
for i in $(seq 1 30); do
  if ! pgrep -f "docker compose -f docker-compose.prod.yml build backend" > /dev/null; then
    echo "BUILD TERMINADO"
    break
  fi
  sleep 15
done
tail -8 /tmp/build_be_sync.log
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 'peruana-informatica-v2-backend'