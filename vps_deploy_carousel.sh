set -e
cd /root/projects/peruana-informatica-v2

git fetch origin main
git checkout -B deploy/carousel-labels-20261125 origin/main
git log --oneline -1

git tag -f rollback-before-carousel-labels-20261125 2eff517 || true
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-frontend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-frontend:latest peruana-informatica-v2-frontend:rollback-before-carousel-labels-20261125
  echo "rollback frontend: $CURRENT"
fi

echo "=== BUILD FRONTEND ==="
nohup docker compose -f docker-compose.prod.yml build frontend > /tmp/build_fe_carousel.log 2>&1 &
echo "build pid: $!"