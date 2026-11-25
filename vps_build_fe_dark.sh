set -e
cd /root/projects/peruana-informatica-v2

git fetch origin main
git checkout -B deploy/admin-dark-20261121 origin/main
git log --oneline -1

# rollback
git tag -f rollback-before-admin-dark-20261121 b4cc0ab || true

# imagen de rollback del frontend actual
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-frontend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-frontend:latest peruana-informatica-v2-frontend:rollback-before-admin-dark-20261121
  echo "rollback image: $CURRENT"
fi

echo "=== BUILD START ==="
nohup docker compose -f docker-compose.prod.yml build frontend > /tmp/build_fe_dark.log 2>&1 &
echo "build pid: $!"
