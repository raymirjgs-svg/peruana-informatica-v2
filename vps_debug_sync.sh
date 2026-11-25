cd /root/projects/peruana-informatica-v2

# Token
TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")

echo "=== 1. Status actual ==="
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/status

echo ""
echo "=== 2. Reset completo ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/reset-state

echo ""
echo "=== 3. Force sync nuevo ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/force

echo ""
echo "=== 4. Logs backend (últimas 30 lineas) ==="
docker logs --tail 30 peruana_backend 2>&1

echo ""
echo "=== 5. Status tras 3 seg ==="
sleep 3
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/status