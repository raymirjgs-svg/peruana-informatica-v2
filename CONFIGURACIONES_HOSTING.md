# 🌐 CONFIGURACIONES POR TIPO DE HOSTING

Esta guía proporciona configuraciones específicas según el tipo de hosting que uses.

---

## 📋 ÍNDICE

1. [Hosting Compartido / Shared Hosting](#hosting-compartido--shared-hosting)
2. [VPS (Virtual Private Server)](#vps-virtual-private-server)
3. [Cloud Hosting (AWS, Google Cloud, Azure)](#cloud-hosting)
4. [Plataformas Especializadas (Vercel, Netlify, Railway)](#plataformas-especializadas)

---

## 🏠 HOSTING COMPARTIDO / SHARED HOSTING

### Características

- ✅ Económico
- ⚠️ Recursos limitados
- ⚠️ Acceso SSH limitado o inexistente
- ✅ Panel de control (cPanel, Plesk)
- ⚠️ Versiones de software predefinidas

### Proveedores Comunes

- Hostinger
- GoDaddy
- Bluehost
- SiteGround
- HostGator

### Configuración con cPanel

#### 1. Configurar Node.js

**Requisitos:**
- cPanel con "Setup Node.js App" instalado
- Node.js 18.x o superior disponible

**Pasos:**

1. **Backend:**
   ```
   Application Root: /home/usuario/backend
   Application URL: api.tudominio.com
   Application Startup File: dist/server.js
   Node.js Version: 18.x
   Application Mode: Production
   ```

2. **Frontend:**
   ```
   Application Root: /home/usuario/frontend
   Application URL: tudominio.com
   Application Startup File: server.js (standalone) o node_modules/next/dist/bin/next
   Node.js Version: 18.x
   Application Mode: Production
   ```

#### 2. Variables de Entorno en cPanel

En "Setup Node.js App" → Environment Variables:

**Backend:**
```
DATABASE_HOST=localhost
DATABASE_NAME=usuario_peruana
DATABASE_USER=usuario_peruana
DATABASE_PASSWORD=tu_password
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tudominio.com
```

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

#### 3. Base de Datos (cPanel)

1. MySQL® Databases → Create New Database
2. Nombre: `peruana_informatica` (se creará como `usuario_peruana_informatica`)
3. Create New User
4. Add User to Database → All Privileges

#### 4. Subir Archivos

**Opción A: File Manager**
1. Comprimir proyecto local
2. Subir .zip via File Manager
3. Extraer en el servidor

**Opción B: FTP (FileZilla)**
```
Host: ftp.tudominio.com
Username: usuario@tudominio.com
Password: tu_password
Port: 21
```

#### 5. SSL (cPanel)

1. SSL/TLS Status
2. Run AutoSSL
3. O instalar Let's Encrypt desde cPanel

### Limitaciones y Soluciones

| Limitación | Solución |
|------------|----------|
| RAM limitada | Optimizar código, reducir procesos concurrentes |
| Sin PM2 | Usar el gestor de procesos de cPanel |
| No hay control sobre versiones | Verificar versiones disponibles antes |
| Sin acceso a Nginx | Usar .htaccess para configuraciones |

### Archivo .htaccess Recomendado

Crear en la raíz pública:

```apache
# Forzar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Comprimir texto, HTML, JavaScript, CSS, XML
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache de navegador
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access 1 year"
  ExpiresByType image/jpeg "access 1 year"
  ExpiresByType image/gif "access 1 year"
  ExpiresByType image/png "access 1 year"
  ExpiresByType text/css "access 1 month"
  ExpiresByType application/pdf "access 1 month"
  ExpiresByType text/javascript "access 1 month"
  ExpiresByType application/javascript "access 1 month"
  ExpiresByType application/x-shockwave-flash "access 1 month"
</IfModule>
```

---

## 🖥️ VPS (VIRTUAL PRIVATE SERVER)

### Características

- ✅ Control total del servidor
- ✅ Acceso SSH completo
- ✅ Instalar cualquier software
- ⚠️ Requiere conocimientos de administración
- ✅ Escalable

### Proveedores Comunes

- DigitalOcean
- Linode
- Vultr
- OVH
- Contabo

### Configuración Inicial del VPS

#### 1. Conectar al Servidor

```bash
ssh root@tu-ip-servidor
```

#### 2. Actualizar Sistema (Ubuntu/Debian)

```bash
apt update && apt upgrade -y
```

#### 3. Instalar Node.js 18.x

```bash
# Agregar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### 4. Instalar MySQL

```bash
# Instalar
apt install -y mysql-server

# Configurar seguridad
mysql_secure_installation

# Crear base de datos
mysql -u root -p
```

En MySQL:
```sql
CREATE DATABASE peruana_informatica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'peruana_user'@'localhost' IDENTIFIED BY 'contraseña_muy_segura';
GRANT ALL PRIVILEGES ON peruana_informatica.* TO 'peruana_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 5. Instalar Nginx

```bash
apt install -y nginx

# Iniciar y habilitar
systemctl start nginx
systemctl enable nginx
```

#### 6. Instalar PM2

```bash
npm install -g pm2
```

### Configuración de Nginx Completa

#### Para Backend (API)

Archivo: `/etc/nginx/sites-available/peruana-api`

```nginx
# Upstream backend
upstream backend_server {
    server localhost:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name api.tudominio.com;
    
    # Tamaño máximo de carga
    client_max_body_size 20M;

    # Logs
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;

    location / {
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Servir uploads
    location /uploads {
        alias /var/www/peruana-informatica/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
}
```

#### Para Frontend

Archivo: `/etc/nginx/sites-available/peruana-frontend`

```nginx
# Upstream frontend
upstream frontend_server {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Logs
    access_log /var/log/nginx/frontend-access.log;
    error_log /var/log/nginx/frontend-error.log;

    location / {
        proxy_pass http://frontend_server;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        proxy_buffering on;
    }

    # Cache para archivos estáticos de Next.js
    location /_next/static {
        proxy_pass http://frontend_server;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache para imágenes optimizadas
    location /_next/image {
        proxy_pass http://frontend_server;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
}
```

#### Activar Sitios

```bash
ln -s /etc/nginx/sites-available/peruana-api /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/peruana-frontend /etc/nginx/sites-enabled/

# Verificar
nginx -t

# Reiniciar
systemctl restart nginx
```

### Configuración de PM2 Avanzada

#### ecosystem.config.js

Crear en `/var/www/peruana-informatica/`:

```javascript
module.exports = {
  apps: [
    {
      name: 'peruana-backend',
      cwd: '/var/www/peruana-informatica/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/backend-error.log',
      out_file: '/var/log/pm2/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'peruana-frontend',
      cwd: '/var/www/peruana-informatica/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/frontend-error.log',
      out_file: '/var/log/pm2/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M'
    }
  ]
};
```

Iniciar con:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Firewall (UFW)

```bash
# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw enable

# Verificar
ufw status
```

### Optimizaciones VPS

#### Swap (si tienes poca RAM)

```bash
# Crear archivo swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### Límites de Archivos

Editar `/etc/security/limits.conf`:
```
* soft nofile 65535
* hard nofile 65535
```

---

## ☁️ CLOUD HOSTING

### AWS (Amazon Web Services)

#### Opción 1: EC2 (Similar a VPS)

1. Crear instancia EC2 (Ubuntu 22.04)
2. Configurar Security Groups (puertos 22, 80, 443)
3. Seguir pasos de VPS

#### Opción 2: Elastic Beanstalk

**Para Backend:**

1. Crear aplicación Node.js
2. Subir código en .zip
3. Configurar variables de entorno
4. Conectar a RDS (base de datos)

**Estructura requerida:**
```
backend/
  ├── dist/
  ├── package.json
  ├── Procfile
  └── .ebextensions/
```

**Procfile:**
```
web: node dist/server.js
```

**Para Frontend:**

Recomendado usar Amplify o Vercel en su lugar.

### Google Cloud Platform

#### Compute Engine (VM)

Similar a EC2, seguir pasos de VPS.

#### App Engine

**app.yaml** para backend:
```yaml
runtime: nodejs18
service: api

env_variables:
  NODE_ENV: "production"
  DATABASE_HOST: "/cloudsql/PROJECT:REGION:INSTANCE"

handlers:
  - url: /.*
    script: auto
```

### Azure

#### Virtual Machines

Similar a VPS/AWS EC2.

#### App Service

1. Crear Web App para Node.js
2. Configurar despliegue continuo desde GitHub
3. Configurar variables de entorno
4. Conectar a Azure Database for MySQL

---

## 🚀 PLATAFORMAS ESPECIALIZADAS

### Vercel (Frontend - RECOMENDADO)

**Ventajas:**
- ✅ Despliegue automático desde Git
- ✅ Optimizado para Next.js
- ✅ CDN global
- ✅ SSL automático
- ✅ Gratis para proyectos pequeños

**Pasos:**

1. **Conectar Repositorio:**
   - Subir código a GitHub/GitLab
   - Importar en vercel.com

2. **Configurar Proyecto:**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Variables de Entorno:**
   ```
   NEXT_PUBLIC_API_URL=https://api.tudominio.com
   ```

4. **Dominio Personalizado:**
   - Settings → Domains
   - Agregar dominio
   - Configurar DNS

### Railway (Backend - Fácil)

**Ventajas:**
- ✅ Despliegue desde Git
- ✅ Base de datos incluida
- ✅ SSL automático
- ✅ Plan gratuito disponible

**Pasos:**

1. **Crear Nuevo Proyecto:**
   - Conectar con GitHub

2. **Agregar Base de Datos:**
   - New → Database → MySQL

3. **Configurar Variables:**
   - Settings → Variables
   - Agregar todas las variables del .env

4. **Desplegar:**
   - Automático con cada push

### Render

**Ventajas:**
- ✅ Gratis para proyectos estáticos
- ✅ Fácil configuración
- ✅ Base de datos PostgreSQL/MySQL

**Para Backend (Web Service):**
```
Build Command: npm install && npm run build
Start Command: npm start
Environment: Node
```

**Para Frontend (Static Site):**
```
Build Command: npm run build
Publish Directory: .next
```

### Netlify (Solo Frontend Estático)

Solo funciona si exportas Next.js como estático:

**next.config.mjs:**
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
};
```

---

## 📊 COMPARATIVA RÁPIDA

| Tipo | Costo | Dificultad | Control | Escalabilidad | Recomendado Para |
|------|-------|------------|---------|---------------|------------------|
| Shared | $ | Fácil | Bajo | Baja | Proyectos pequeños |
| VPS | $$ | Media | Alto | Media | Proyectos medianos |
| Cloud | $$$ | Media-Alta | Alto | Alta | Proyectos grandes |
| Vercel | Gratis-$$ | Muy Fácil | Medio | Alta | Frontend |
| Railway | Gratis-$$ | Fácil | Medio | Media | Backend pequeño |

---

## 🎯 RECOMENDACIÓN FINAL

### Para Peruana Informática:

#### Opción Económica:
- **Frontend:** Vercel (gratis)
- **Backend:** VPS económico ($5-10/mes)
- **BD:** En el mismo VPS

#### Opción Balanceada:
- **Frontend:** Vercel
- **Backend:** Railway o VPS
- **BD:** Railway o VPS

#### Opción Premium:
- **Frontend:** Vercel Pro
- **Backend:** AWS/GCP con auto-scaling
- **BD:** RDS/Cloud SQL

---

**Última actualización:** Diciembre 2025
