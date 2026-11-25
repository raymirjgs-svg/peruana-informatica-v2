set -e
cd /root/projects/peruana-informatica-v2

echo "=== HEAD antes ==="
git log --oneline -1

git fetch origin main

# ---------- PUNTOS DE RETORNO ----------
# 1) tag de git apuntando al commit anterior (rollback de código)
git tag -f rollback-before-public-ui-20261125 e7e52ef
echo "tag git de retorno: rollback-before-public-ui-20261125 -> e7e52ef"

# 2) tag de la imagen Docker actual (rollback sin reconstruir)
CURRENT=$(docker images --format '{{.ID}}' peruana-informatica-v2-frontend:latest | head -1)
if [ -n "$CURRENT" ]; then
  docker tag peruana-informatica-v2-frontend:latest peruana-informatica-v2-frontend:rollback-before-public-ui-20261125
  echo "tag imagen de retorno: peruana-informatica-v2-frontend:rollback-before-public-ui-20261125 ($CURRENT)"
fi

git checkout -B deploy/public-ui-20261125 origin/main
echo "=== HEAD desplegado ==="
git log --oneline -1

# 3) backup del repo
mkdir -p /root/backups
tar czf /root/backups/repo-public-ui-$(date +%Y%m%d%H%M).tar.gz --exclude=node_modules --exclude=.next --exclude=dist peruana-informatica docker-compose.prod.yml 2>/dev/null || true
ls -lh /root/backups/repo-public-ui-*.tar.gz | tail -1

echo "=== PREPARADO ==="