cd /root/projects/peruana-informatica-v2

# Obtener token admin
TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")

echo "=== TEST /api/sync/status ==="
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/status

echo ""
echo "=== TEST /api/sync/force ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/force

echo ""
echo "=== TEST /api/sync/reset-state ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/reset-state

echo ""
echo "=== LOGS BACKEND ==="
docker logs --tail 10 peruana_backend 2>&1