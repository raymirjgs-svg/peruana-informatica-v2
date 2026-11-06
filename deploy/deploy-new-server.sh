#!/bin/bash
# ============================================
# Script de despliegue — Nuevo servidor
# Ejecutar como root en Ubuntu/Debian
#
# Proyectos:
#   peruanadeinformatica.com.pe  (puerto 3000/3001)
#   katsher.com                  (puerto 3005)
#   magnatte.es                  (puerto 3007)
#
# Uso: bash deploy-new-server.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!!]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

echo ""
echo "========================================"
echo "  DEPLOY — NUEVO SERVIDOR DE PRODUCCIÓN"
echo "========================================"
echo ""

# ── 1. DEPENDENCIAS ───────────────────────────────────────────────
log "Instalando dependencias del sistema..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git curl

systemctl enable --now docker nginx
log "Docker y Nginx activos."

# ── 2. DIRECTORIOS BASE ────────────────────────────────────────────
log "Creando estructura de directorios..."
mkdir -p /root/projects
mkdir -p /root/migration
mkdir -p /var/www/certbot
mkdir -p /var/www/images
mkdir -p /var/www/katsher
mkdir -p /var/www/magnatte_v2

# ── 2b. TRANSFERIR ARCHIVOS DE MIGRACIÓN ──────────────────────────
warn "Transfiere los archivos de migración del servidor anterior a /root/migration/"
warn "En el servidor ANTERIOR ejecuta:"
warn "  rsync -avz --progress /root/backups/migration/ root@NUEVA_IP:/root/migration/"
warn ""
warn "Archivos a transferir (~508 MB):"
warn "  - peruana_informatica.sql  (3 MB)"
warn "  - peruana_images.tar.gz    (433 MB)"
warn "  - katsher_db.sql           (17 KB)"
warn "  - katsher_images.tar.gz    (5 MB)"
warn "  - magnatte_v2.sql          (41 KB)"
warn "  - magnatte_images.tar.gz   (68 MB)"
echo ""
read -p "Presiona ENTER cuando los archivos estén en /root/migration/ ..."

# Restaurar imágenes
log "Restaurando imágenes..."
tar -xzf /root/migration/peruana_images.tar.gz    -C /var/www/
tar -xzf /root/migration/katsher_images.tar.gz    -C /var/www/
tar -xzf /root/migration/magnatte_images.tar.gz   -C /var/www/
cp /root/migration/katsher_db.sql   /root/projects/katsher_v2/katsher_db.sql    2>/dev/null || true
cp /root/migration/magnatte_v2.sql  /root/projects/magnatte/magnatte_v2.sql     2>/dev/null || true
log "Imágenes restauradas en /var/www/"

# ── 3. CLONAR REPOSITORIOS ─────────────────────────────────────────
warn "Necesitas configurar acceso SSH a GitHub antes de continuar."
warn "Repositorios a clonar:"
warn "  - Peruana Informática: https://github.com/raymirjgs-svg/peruana-informatica-v2"
warn "  - Katsher:             (URL del repo katsher)"
warn "  - Magnatte:            (URL del repo magnatte)"
echo ""
read -p "Presiona ENTER cuando los repos estén clonados en /root/projects/ ..."

# ── 4. CERTIFICADOS SSL ────────────────────────────────────────────
log "Obteniendo certificados SSL con Let's Encrypt..."
warn "Asegúrate de que el DNS de los 3 dominios apunte a este servidor antes de continuar."
echo ""
read -p "¿Están los DNS configurados? (s/N): " dns_ok
if [[ "$dns_ok" != "s" && "$dns_ok" != "S" ]]; then
    warn "Configura el DNS primero y vuelve a ejecutar el script."
    exit 0
fi

# Obtener certificados (nginx debe estar corriendo y puerto 80 abierto)
certbot --nginx --non-interactive --agree-tos --email admin@peruanadeinformatica.com.pe \
    -d peruanadeinformatica.com.pe -d www.peruanadeinformatica.com.pe || warn "Error en cert peruana - verificar DNS"

certbot --nginx --non-interactive --agree-tos --email admin@katsher.com \
    -d katsher.com -d www.katsher.com || warn "Error en cert katsher - verificar DNS"

certbot --nginx --non-interactive --agree-tos --email admin@magnatte.es \
    -d magnatte.es -d www.magnatte.es || warn "Error en cert magnatte - verificar DNS"

log "Certificados SSL obtenidos."

# ── 5. CONFIGURAR NGINX ────────────────────────────────────────────
log "Configurando nginx..."
cp /root/projects/peruana-informatica-v2/nginx/peruanadeinformatica.conf /etc/nginx/sites-enabled/peruanadeinformatica.com.pe
cp /root/projects/peruana-informatica-v2/nginx/katsher.conf              /etc/nginx/sites-enabled/katsher.com
cp /root/projects/peruana-informatica-v2/nginx/magnatte.conf             /etc/nginx/sites-enabled/magnatte.es
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
log "Nginx configurado y recargado."

# ── 6. PERUANA INFORMÁTICA ─────────────────────────────────────────
log "Desplegando Peruana Informática..."
cd /root/projects/peruana-informatica-v2

warn "Crea el archivo envs/.env.production con los valores de producción."
warn "Usa como referencia el envs/.env.production del servidor anterior."
read -p "Presiona ENTER cuando envs/.env.production esté listo ..."

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Importar base de datos de peruana
log "Importando BD de Peruana Informática..."
sleep 30  # esperar que MySQL arranque
docker exec -i peruana_mysql mysql -uroot -p"$(grep MYSQL_ROOT_PASSWORD envs/.env.production | cut -d= -f2)" peruana_informatica < /root/migration/peruana_informatica.sql
log "Peruana Informática desplegada en 127.0.0.1:3000"

# ── 7. KATSHER ─────────────────────────────────────────────────────
log "Desplegando Katsher..."
warn "Coloca el repo de katsher en /root/projects/katsher_v2"
warn "Coloca el dump katsher_db.sql en /root/projects/katsher_v2/"
read -p "Presiona ENTER cuando esté listo ..."

cd /root/projects/katsher_v2
# Copiar docker-compose del nuevo servidor
cp /root/projects/peruana-informatica-v2/deploy/katsher/docker-compose.yml ./docker-compose.newserver.yml
docker compose -f docker-compose.newserver.yml build
docker compose -f docker-compose.newserver.yml up -d
log "Katsher desplegado en 127.0.0.1:3005"

# ── 8. MAGNATTE ────────────────────────────────────────────────────
log "Desplegando Magnatte..."
warn "Coloca el repo de magnatte en /root/projects/magnatte"
warn "Coloca el dump magnatte_v2.sql en /root/projects/magnatte/"
warn "Configura /root/projects/magnatte/.env con los valores de producción (usar .env.example)"
read -p "Presiona ENTER cuando esté listo ..."

cd /root/projects/magnatte
cp /root/projects/peruana-informatica-v2/deploy/magnatte/docker-compose.yml ./docker-compose.newserver.yml
docker compose -f docker-compose.newserver.yml build
docker compose -f docker-compose.newserver.yml up -d
log "Magnatte desplegado en 127.0.0.1:3007"

# ── 9. VERIFICACIÓN FINAL ──────────────────────────────────────────
echo ""
log "Verificando servicios..."
sleep 10

curl -sf https://peruanadeinformatica.com.pe/health && log "peruanadeinformatica.com.pe OK" || warn "peruanadeinformatica.com.pe ERROR"
curl -sf https://katsher.com/katsher && log "katsher.com OK"            || warn "katsher.com ERROR"
curl -sf https://magnatte.es/magnatte && log "magnatte.es OK"           || warn "magnatte.es ERROR"

echo ""
log "Renovación automática de SSL activada (certbot timer)."
systemctl enable certbot.timer || (echo "0 12 * * * root certbot renew --quiet" >> /etc/crontab)

echo ""
echo "========================================"
echo "  DEPLOY COMPLETADO"
echo "========================================"
