set -e
cd /root/projects/peruana-informatica-v2

echo "=== FORCE RECREATE BACKEND ==="
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate backend

sleep 15

echo "=== ESTADO ==="
docker ps --filter name=peruana_backend --format '{{.Names}} | {{.Status}} | {{.Image}}'

echo "=== HEALTH ==="
curl -s -o /dev/null -w "backend /health -> %{http_code}\n" http://127.0.0.1:3001/health
curl -s -o /dev/null -w "frontend / -> %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "public https -> %{http_code}\n" https://peruanadeinformatica.com.pe/