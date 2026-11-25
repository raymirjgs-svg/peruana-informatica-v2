set -e
cd /root/projects/peruana-informatica-v2

echo "=== IMAGEN ACTUAL (para rollback) ==="
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}' | grep 'peruana-informatica-v2-frontend' || true

# Tag de rollback de la imagen actual
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-frontend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-frontend:latest peruana-informatica-v2-frontend:rollback-before-admin-ui-20261121
  echo "rollback image: peruana-informatica-v2-frontend:rollback-before-admin-ui-20261121 ($CURRENT)"
fi

echo "=== BUILD START ==="
nohup docker compose -f docker-compose.prod.yml build frontend > /tmp/build_fe_ui.log 2>&1 &
echo "build pid: $!"
