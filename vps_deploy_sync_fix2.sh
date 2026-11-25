set -e
cd /root/projects/peruana-informatica-v2

git fetch origin main
git checkout -B deploy/sync-timeout-fix origin/main
git log --oneline -1

# Tag rollback
git tag -f rollback-before-sync-timeout-20261125 7aed956 || true
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-backend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-backend:latest peruana-informatica-v2-backend:rollback-before-sync-timeout-20261125
  echo "rollback backend: $CURRENT"
fi

echo "=== BUILD BACKEND ==="
nohup docker compose -f docker-compose.prod.yml build backend > /tmp/build_be_sync2.log 2>&1 &
echo "build pid: $!"