set -e
cd /root/projects/peruana-informatica-v2
echo "=== HEAD antes ==="
git log --oneline -1

# Traer el commit nuevo
git fetch origin main
git checkout -B deploy/admin-ui-20261121 origin/main
git log --oneline -1

# Tag de rollback del estado anterior del repo
git tag -f rollback-before-admin-ui-20261121 d281d2c || true

echo "=== rollback tags existentes ==="
git tag | grep rollback | tail -8

# Backup del repo por si acaso
mkdir -p /root/backups
tar czf /root/backups/repo-admin-ui-$(date +%Y%m%d%H%M).tar.gz --exclude=node_modules --exclude=.next --exclude=dist . 2>/dev/null || true
ls -lh /root/backups/repo-admin-ui-*.tar.gz | tail -2

echo "=== OK PREPARADO ==="
