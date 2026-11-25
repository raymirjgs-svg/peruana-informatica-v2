cd /root/projects/peruana-informatica-v2
echo "=== CONTAINER ACTUAL ==="
docker ps --filter name=peruana_frontend --format '{{.Names}} | {{.Status}} | {{.Image}} | {{.CreatedAt}}'
echo "--- image id en uso ---"
docker inspect peruana_frontend --format '{{.Image}}'
echo "--- latest ---"
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep 'peruana-informatica-v2-frontend:latest'
echo "=== CONTENIDO SERVIDO (marca del commit) ==="
docker exec peruana_frontend sh -c "ls -la .next/BUILD_ID 2>/dev/null && cat .next/BUILD_ID" || true
echo "=== HEAD DEL REPO EN VPS ==="
git log --oneline -1
echo "=== HEALTH ==="
curl -s -o /dev/null -w "/ -> %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "/admin -> %{http_code}\n" http://127.0.0.1:3000/admin
curl -s -o /dev/null -w "https -> %{http_code}\n" https://peruanadeinformatica.com.pe/admin/login
