set -e
cd /root/projects/peruana-informatica-v2

echo "=== UP BACKEND (sin deps) ==="
docker compose -f docker-compose.prod.yml up -d --no-deps backend

sleep 15

echo "=== ESTADO CONTAINER ==="
docker ps --filter name=peruana_backend --format '{{.Names}} | {{.Status}} | {{.Image}}'

echo "=== HEALTH ==="
curl -s -o /dev/null -w "backend /health -> %{http_code}\n" http://127.0.0.1:3001/health
curl -s -o /dev/null -w "backend /api/health -> %{http_code}\n" http://127.0.0.1:3001/api/health
curl -s -o /dev/null -w "frontend / -> %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "public https -> %{http_code}\n" https://peruanadeinformatica.com.pe/

echo "=== TEST SYNC ENDPOINTS ==="
curl -s -H "Authorization: Bearer $(docker exec peruana_backend node -e \"const jwt=require('jsonwebtoken'); console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, process.env.JWT_SECRET, {expiresIn:'1h'}))\" 2>/dev/null)" http://127.0.0.1:3001/api/sync/status 2>/dev/null | head -c 200; echo