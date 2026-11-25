cd /root/projects/peruana-informatica-v2

TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")

echo "=== 1. Sync single product from ERP ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"ids":["20934"]}' http://127.0.0.1:3001/api/sync/products

echo ""
echo "=== 2. Check product in DB after sync ==="
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/products/slug/disco-solido-kingspec-m2-nx-256-256gb-nvme-pcie-30-2280-3600-mbs

echo ""
echo "=== 3. Check what ERP returns directly ==="
curl -s "https://peruanadeinformatica.com.pe/api/sync/product/20934" 2>&1 | head -c 300; echo