cd /root/projects/peruana-informatica-v2 || exit 1
echo "=== 1) login admin con las credenciales del cliente ==="
curl -sS -m 20 -o /tmp/l3.json -w 'http=%{http_code}\n' -X POST "http://127.0.0.1:3001/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@peruanadeinformatica.com","password":"Peruana2026!"}'
head -c 250 /tmp/l3.json | sed 's/"accessToken":"[^"]*"/"accessToken":"<oculto>"/'
echo ""
echo ""
echo "=== 2) el token funciona en una ruta protegida? ==="
TOKEN=$(grep -oE '"accessToken":"[^"]+"' /tmp/l3.json | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  curl -sS -m 20 -o /tmp/me.json -w 'GET /api/admin/auth/me -> %{http_code}\n' "http://127.0.0.1:3001/api/admin/auth/me" -H "Authorization: Bearer $TOKEN"
  head -c 200 /tmp/me.json; echo ""
fi
echo ""
echo "=== 3) rate limit: cuantos intentos hay desde la IP del cliente (15:00-15:35) ==="
grep "179.6.164.156" /var/log/nginx/access.log | grep "POST /api/auth/callback" | wc -l
echo ""
echo "=== 4) el frontend redirige con reason=expired cuando? ==="
grep -rn "reason=expired" /var/log/nginx/access.log | wc -l
echo ""
echo "=== 5) estado del rate limiter en redis (si aplica) ==="
docker exec peruana_redis sh -c "redis-cli --scan --pattern '*rate*' 2>/dev/null | head -5"
