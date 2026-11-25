cd /root/projects/peruana-informatica-v2
echo "=== IMAGEN EN USO ==="
docker ps --filter name=peruana_frontend --format '{{.Names}} | {{.Status}} | {{.Image}}'
docker inspect peruana_frontend --format '{{.Image}}'
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep 'peruana-informatica-v2-frontend:latest'

echo "=== BUILD_ID ==="
docker exec peruana_frontend sh -c "cat .next/BUILD_ID 2>/dev/null" || true

echo "=== HEALTH ==="
curl -s -o /dev/null -w "/ -> %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "/admin -> %{http_code}\n" http://127.0.0.1:3000/admin
curl -s -o /dev/null -w "https -> %{http_code}\n" https://peruanadeinformatica.com.pe/

echo "=== HEAD REPO VPS ==="
git log --oneline -1