set -e
cd /root/projects/peruana-informatica-v2

git fetch origin main
git checkout -B deploy/sync-final origin/main
git log --oneline -1

git tag -f rollback-before-sync-final-20261125 2eff517^ || true
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-backend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-backend:latest peruana-informatica-v2-backend:rollback-before-sync-final-20261125
  echo "rollback backend: $CURRENT"
fi

echo "=== BUILD BACKEND ==="
nohup docker compose -f docker-compose.prod.yml build backend > /tmp/build_be_final.log 2>&1 &
echo "build pid: $!"