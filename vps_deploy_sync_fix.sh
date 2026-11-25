set -e
cd /root/projects/peruana-informatica-v2

git fetch origin main
git checkout -B deploy/sync-fix-20261125 origin/main
git log --oneline -1

# Tag de retorno (código + imagen)
git tag -f rollback-before-sync-fix-20261125 8ced8ad || true
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-backend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-backend:latest peruana-informatica-v2-backend:rollback-before-sync-fix-20261125
  echo "rollback backend image: $CURRENT"
fi

echo "=== BUILD BACKEND ==="
nohup docker compose -f docker-compose.prod.yml build backend > /tmp/build_be_sync.log 2>&1 &
echo "build pid: $!"