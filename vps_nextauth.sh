cd /root/projects/peruana-informatica-v2 || exit 1
echo "=== 1) vars de NextAuth en el contenedor frontend (solo presencia y largo) ==="
docker exec peruana_frontend sh -c 'for v in NEXTAUTH_URL NEXTAUTH_SECRET NEXTAUTH_URL_INTERNAL INTERNAL_API_URL NEXT_PUBLIC_API_URL; do val=$(printenv $v); if [ -z "$val" ]; then echo "$v: VACIA"; else echo "$v: presente (largo ${#val})"; fi; done'
echo ""
echo "=== 2) NEXTAUTH_URL: valor (no es secreto) ==="
docker exec peruana_frontend sh -c 'printenv NEXTAUTH_URL; printenv NEXTAUTH_URL_INTERNAL'
echo ""
echo "=== 3) el secreto parece placeholder? (solo patron) ==="
docker exec peruana_frontend sh -c 'v=$(printenv NEXTAUTH_SECRET); case "$v" in *change-this*|*placeholder*|*must-be*|*TODO*|*secret*) echo "PATRON SOSPECHOSO: $v";; *) echo "sin patrones de placeholder (largo ${#v})";; esac'
echo ""
echo "=== 4) cookies que devuelve el login admin (NextAuth) ==="
curl -sS -m 20 -D - -o /dev/null -X POST "http://127.0.0.1:3000/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Cookie: csrfToken=test' \
  --data 'csrfToken=test&email=admin@peruanadeinformatica.com&password=Peruana2026!&json=true' 2>&1 | grep -iE "^HTTP|set-cookie|location" | sed 's/next-auth.session-token=[^;]*/next-auth.session-token=<oculto>/' | head -10
echo ""
echo "=== 5) endpoints NEXTAUTH: /api/auth/providers responde? ==="
curl -sS -m 20 "http://127.0.0.1:3000/api/auth/providers" | head -c 200; echo ""
echo ""
echo "=== 6) donde redirige reason=expired ==="
docker exec peruana_frontend sh -c "grep -ro 'reason=expired' /app/.next/ 2>/dev/null | sed 's|.*\.next/||' | sort -u | head -5"
