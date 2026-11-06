# Guía de Despliegue Inicial en VPS

Esta guía describe paso a paso cómo desplegar el proyecto `peruana-informatica_v2` en un servidor VPS Linux limpio.

**Datos del Servidor (Referencia)**
*   **IP**: `200.58.98.122`
*   **User**: `root`
*   **SSH Port**: `5313`

---

## 1. Preparación del Servidor

Conéctate vía SSH desde tu terminal local:
```bash
ssh -p 5313 root@200.58.98.122
```

### 1.1 Actualizar Sistema y Firewall
```bash
# Actualizar repositorios
apt update && apt upgrade -y

# Instalar herramientas básicas
apt install -y curl git ufw

# Configurar Firewall (OBLIGATORIO antes de activar)
ufw allow 5313/tcp   # SSH (CRÍTICO: No te bloquees fuera)
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
```

### 1.2 Instalar Docker & Docker Compose
```bash
# Script oficial de instalación
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalación
docker --version
docker compose version
```

---

## 2. Configuración del Proyecto

### 2.1 Estructura de Directorios
```bash
# Crear directorio base
mkdir -p /app/peruana-informatica_v2
cd /app/peruana-informatica_v2

# Crear carpetas necesarias para volúmenes
mkdir -p backups certbot/conf certbot/www nginx envs

# Clonar repositorio (O usar RSYNC si es local)
# Opción A: Git Clone
git clone <TU_REPO_URL> .

# Opción B: Si el código está solo en tu PC local, usa rsync desde tu PC:
# rsync -av -e "ssh -p 5313" --exclude 'node_modules' --exclude '.git' . root@200.58.98.122:/app/peruana-informatica_v2/
```

### 2.2 Configurar Variables de Entorno
Crea el archivo `.env.production` con tus secretos reales.
```bash
nano envs/.env.production
```
*Pega el contenido de tu `.env.production` local, pero cambia las contraseñas por valores seguros.*

---

## 3. Despliegue

### 3.1 Levantar Producción
Ejecuta el comando combinado para usar la configuración base + producción.
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3.2 Verificar Estado
```bash
# Ver contenedores activos
docker compose ps

# Ver logs de arranque (busca errores)
docker compose logs -f --tail=50
```

---

## 4. Obtener Certificados SSL (HTTPS)
La primera vez, Nginx puede fallar si no encuentra certificados.

1.  **Modificar Nginx temporalmente**:
    Edita `nginx/nginx.conf` y comenta la sección `server { listen 443 ... }`.
    Reinicia Nginx: `docker compose restart nginx`.

2.  **Solicitar Certificado**:
    ```bash
    docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d midominio.com -d www.midominio.com
    ```

3.  **Restaurar Nginx**:
    Descomenta la sección 443 en `nginx/nginx.conf`.
    Reinicia: `docker compose restart nginx`.

---

## 5. Checklist de Validación Final

- [ ] **Acceso Web**: Entra a `https://midominio.com`. ¿Carga?
- [ ] **API Health**: Visita `https://midominio.com/api/health`. Debería responder JSON `ok`.
- [ ] **Persistencia**: Sube una imagen en el panel admin, reinicia containers (`docker compose restart`), ¿la imagen sigue ahí?
- [ ] **Backups**: Verifica que exista la carpeta `/app/peruana-informatica_v2/backups`.
