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

echo "=== TEST SYNC ==="
TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"ids":["20934"]}' http://127.0.0.1:3001/api/sync/products

echo ""
echo "=== CHECK PRODUCT AFTER SYNC ==="
sleep 3
curl -s "https://peruanadeinformatica.com.pe/api/products/slug/disco-solido-kingspec-m2-nx-256-256gb-nvme-pcie-30-2280-3600-mbs" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const p=JSON.parse(d);console.log('price:', p.price);console.log('priceWeb:', p.price_web);console.log('priceCot:', p.price_cot);console.log('priceDis:', p.price_dis);console.log('stock:', p.stock);})"