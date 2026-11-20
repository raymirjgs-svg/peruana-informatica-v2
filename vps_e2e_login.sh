cd /root/projects/peruana-informatica-v2 || exit 1
J=/tmp/cj.txt
rm -f $J

echo "=== 1) GET csrf ==="
CSRF=$(curl -sS -m 20 -c $J "http://127.0.0.1:3000/api/auth/csrf" | grep -oE '"csrfToken":"[^"]+"' | cut -d'"' -f4)
echo "csrfToken obtenido: ${#CSRF} caracteres"

echo ""
echo "=== 2) POST callback/credentials con el csrf real ==="
curl -sS -m 25 -b $J -c $J -D /tmp/h.txt -o /tmp/body.json -w 'http=%{http_code}\n' \
  -X POST "http://127.0.0.1:3000/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=admin@peruanadeinformatica.com" \
  --data-urlencode "password=Peruana2026!" \
  --data-urlencode "json=true"
echo "--- body ---"
head -c 300 /tmp/body.json; echo ""
echo "--- cookies de sesion ---"
grep -oE "next-auth.session-token[^;]*" /tmp/h.txt | sed 's/=.*/=<oculto>/' | head -3
grep -c "session-token" /tmp/h.txt

echo ""
echo "=== 3) GET /api/auth/session con la cookie ==="
curl -sS -m 20 -b $J "http://127.0.0.1:3000/api/auth/session" | head -c 400; echo ""

echo ""
echo "=== 4) una ruta admin con el token de la sesion ==="
TOKEN=$(curl -sS -m 20 -b $J "http://127.0.0.1:3000/api/auth/session" | grep -oE '"accessToken":"[^"]+"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  curl -sS -m 20 -o /tmp/orders.json -w 'GET /api/admin/orders -> %{http_code}\n' "http://127.0.0.1:3001/api/admin/orders" -H "Authorization: Bearer $TOKEN"
  head -c 120 /tmp/orders.json; echo ""
else
  echo "sin accessToken en la sesion"
fi
