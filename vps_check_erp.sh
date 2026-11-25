cd /root/projects/peruana-informatica-v2

# Check what ERP returns for this product
TOKEN=$(docker exec peruana_backend node -e "
const jwt=require('jsonwebtoken');
const secret=process.env.JWT_SECRET;
console.log(jwt.sign({userId:1,email:'admin@peruanadeinformatica.com',role:'admin'}, secret, {expiresIn:'1h'}));
")

echo "=== 1. What ERP returns via sync endpoint (admin) ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"ids":["20934"]}' http://127.0.0.1:3001/api/sync/products

echo ""
echo "=== 2. Direct ERP API call (simulating what sync does) ==="
# The sync uses PeruanaInformaticaService.obtenerStockYPrecio which calls consultarArticulo
# Let's check the token
docker exec peruana_backend node -e "
const PeruanaInformaticaService = require('./dist/services/PeruanaInformaticaService').PeruanaInformaticaService;
PeruanaInformaticaService.obtenerStockYPrecio('20934').then(r => console.log('ERP data:', JSON.stringify(r, null, 2))).catch(e => console.error('Error:', e.message));
" 2>&1