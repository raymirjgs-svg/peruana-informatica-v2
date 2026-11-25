set -e
cd /root/projects/peruana-informatica-v2

echo "=== UP FRONTEND (sin deps) ==="
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

sleep 12

echo "=== ESTADO ==="
docker ps --filter name=peruana_frontend --format '{{.Names}} | {{.Status}} | {{.Image}}'

echo "=== HEALTH ==="
curl -s -o /dev/null -w "frontend / -> %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "frontend /admin -> %{http_code}\n" http://127.0.0.1:3000/admin
curl -s -o /dev/null -w "public https -> %{http_code}\n" https://peruanadeinformatica.com.pe/

echo "=== BUILD_ID ==="
docker exec peruana_frontend sh -c "cat .next/BUILD_ID 2>/dev/null" || true