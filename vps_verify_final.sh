cd /root/projects/peruana-informatica-v2

TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")

echo "=== 1. Status ==="
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/status

echo ""
echo "=== 2. Force sync (3 productos) ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"ids":["15953","15954","15955"]}' http://127.0.0.1:3001/api/sync/products

echo ""
echo "=== 3. Logs (últimas 15) ==="
sleep 3
docker logs --tail 15 peruana_backend 2>&1

echo ""
echo "=== 4. Status final ==="
sleep 2
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/sync/status