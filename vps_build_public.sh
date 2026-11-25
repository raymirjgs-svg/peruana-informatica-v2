set -e
cd /root/projects/peruana-informatica-v2
echo "=== BUILD FRONTEND START ==="
nohup docker compose -f docker-compose.prod.yml build frontend > /tmp/build_public.log 2>&1 &
echo "build pid: $!"