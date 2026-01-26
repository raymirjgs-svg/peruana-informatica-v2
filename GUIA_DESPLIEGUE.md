# 🚀 GUÍA DE DESPLIEGUE - PERUANA INFORMÁTICA

Esta guía te ayudará a preparar y desplegar el proyecto en el hosting del cliente.

---

## 📋 TABLA DE CONTENIDOS

1. [Pre-requisitos](#pre-requisitos)
2. [Preparación del Proyecto](#preparación-del-proyecto)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Despliegue del Backend](#despliegue-del-backend)
5. [Despliegue del Frontend](#despliegue-del-frontend)
6. [Configuración de Dominios y SSL](#configuración-de-dominios-y-ssl)
7. [Verificación Post-Despliegue](#verificación-post-despliegue)
8. [Mantenimiento](#mantenimiento)

---

## 📦 PRE-REQUISITOS

### Información del Hosting

Antes de comenzar, necesitas obtener del cliente:

- ✅ **Tipo de hosting** (Shared, VPS, Cloud)
- ✅ **Acceso SSH** (usuario y contraseña o clave SSH)
- ✅ **Panel de control** (cPanel, Plesk, DirectAdmin, etc.)
- ✅ **IP del servidor** o dominio
- ✅ **Credenciales de base de datos MySQL**
- ✅ **Versión de Node.js disponible** (mínimo 18.x)

### Software Requerido en el Servidor

```bash
- Node.js 18.x o superior
- MySQL 8.0 o superior
- PM2 (para gestión de procesos)
- Nginx o Apache (como proxy reverso)
- Git (opcional, para despliegue continuo)
```

---

## 🛠️ PREPARACIÓN DEL PROYECTO

### Paso 1: Construir el Backend

```bash
# Navegar a la carpeta del backend
cd peruana-informatica/backend

# Instalar dependencias de producción
npm ci --only=production

# Compilar TypeScript a JavaScript
npm run build
```

**Resultado esperado:** Se creará una carpeta `dist/` con el código compilado.

### Paso 2: Construir el Frontend

```bash
# Navegar a la carpeta del frontend
cd ../frontend

# Instalar dependencias de producción
npm ci --only=production

# Construir para producción
npm run build
```

**Resultado esperado:** Se creará una carpeta `.next/` con el build optimizado.

### Paso 3: Verificar Archivos de Configuración

Asegúrate de tener estos archivos preparados:

```
backend/
  ├── .env.production          # Variables de entorno de producción
  ├── dist/                    # Código compilado
  ├── package.json
  ├── package-lock.json
  ├── uploads/                 # Carpeta de archivos subidos
  └── public/                  # Archivos estáticos

frontend/
  ├── .env.production         # Variables de entorno de producción
  ├── .next/                  # Build de producción
  ├── public/                 # Archivos estáticos
  ├── package.json
  └── package-lock.json
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Opción A: Usando cPanel (Hosting Compartido)

1. **Crear la Base de Datos:**
   - Inicia sesión en cPanel
   - Ve a "MySQL® Databases"
   - Crea una nueva base de datos: `peruana_informatica`
   - Crea un usuario MySQL con contraseña segura
   - Asigna todos los privilegios al usuario

2. **Importar Estructura (si existe dump SQL):**
   ```bash
   # Desde tu computadora local
   mysql -h [HOST] -u [USUARIO] -p [NOMBRE_DB] < database_estructura.sql
   ```

3. **Ejecutar Script de Inicialización:**
   ```bash
   # Una vez que el backend esté desplegado
   npm run init-db
   ```

### Opción B: Usando SSH (VPS/Cloud)

```bash
# Conectar al servidor
ssh usuario@servidor-ip

# Crear base de datos
mysql -u root -p

# Dentro de MySQL
CREATE DATABASE peruana_informatica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'peruana_user'@'localhost' IDENTIFIED BY 'contraseña_segura_aqui';
GRANT ALL PRIVILEGES ON peruana_informatica.* TO 'peruana_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Configurar Variables de Entorno del Backend

Crear `backend/.env.production`:

```env
# BASE DE DATOS
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=peruana_informatica
DATABASE_USER=peruana_user
DATABASE_PASSWORD=[CONTRASEÑA_SEGURA]

# SERVIDOR
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tudominio.com

# EMAIL (Producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tudominio.com
SMTP_PASS=[APP_PASSWORD]
ADMIN_EMAIL=admin@tudominio.com

# IA (Opcional)
GEMINI_API_KEY=[TU_API_KEY_SI_TIENES]

# ERP (Si aplica)
ERP_API_URL=http://54.144.139.115/peruanadeinformatica/api
ERP_API_TOKEN=[TOKEN_DEL_CLIENTE]

# SEGURIDAD
JWT_SECRET=[GENERAR_CLAVE_ALEATORIA_SEGURA]
SESSION_SECRET=[GENERAR_CLAVE_ALEATORIA_SEGURA]
```

**⚠️ IMPORTANTE:** 
- Usa contraseñas seguras y aleatorias
- Nunca compartas estos datos en repositories públicos
- Para generar claves seguras: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🖥️ DESPLIEGUE DEL BACKEND

### Método 1: Hosting Compartido con cPanel

Si el hosting tiene Node.js App Manager:

1. **Subir Archivos:**
   ```bash
   # Usar FileZilla, WinSCP o cPanel File Manager
   # Subir la carpeta backend/ a /home/usuario/backend/
   ```

2. **Configurar Node.js App:**
   - En cPanel, ir a "Setup Node.js App"
   - Crear nueva aplicación:
     - **Node.js version:** 18.x o superior
     - **Application mode:** Production
     - **Application root:** backend
     - **Application URL:** api.tudominio.com
     - **Application startup file:** dist/server.js

3. **Instalar Dependencias:**
   ```bash
   # Desde la terminal de cPanel o SSH
   cd ~/backend
   npm ci --only=production
   ```

### Método 2: VPS/Cloud con PM2

```bash
# Conectar al servidor
ssh usuario@servidor-ip

# Crear directorio del proyecto
mkdir -p /var/www/peruana-informatica
cd /var/www/peruana-informatica

# Clonar o subir archivos (usando Git o rsync)
git clone [tu-repositorio] .
# O usar rsync desde tu máquina local:
# rsync -avz --exclude 'node_modules' ./backend/ usuario@servidor:/var/www/peruana-informatica/backend/

# Navegar al backend
cd backend

# Instalar dependencias
npm ci --only=production

# Compilar TypeScript
npm run build

# Instalar PM2 globalmente
npm install -g pm2

# Configurar PM2
pm2 start dist/server.js --name "peruana-backend" -i max

# Guardar configuración PM2
pm2 save

# Configurar PM2 para arrancar en boot
pm2 startup
```

### Configurar Nginx como Proxy Reverso

Crear archivo `/etc/nginx/sites-available/peruana-api`:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Aumentar timeouts para operaciones largas
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Servir archivos estáticos
    location /uploads {
        alias /var/www/peruana-informatica/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar la configuración:

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/peruana-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🌐 DESPLIEGUE DEL FRONTEND

### Configurar Variables de Entorno del Frontend

Crear `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

### Método 1: Next.js Standalone (Recomendado para VPS)

1. **Modificar `next.config.mjs`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... resto de la configuración
};

export default nextConfig;
```

2. **Construir y Desplegar:**

```bash
# En tu máquina local
cd frontend
npm run build

# Subir archivos al servidor
# Los archivos necesarios estarán en .next/standalone/
rsync -avz .next/standalone/ usuario@servidor:/var/www/peruana-informatica/frontend/
rsync -avz .next/static usuario@servidor:/var/www/peruana-informatica/frontend/.next/
rsync -avz public usuario@servidor:/var/www/peruana-informatica/frontend/
```

3. **Configurar PM2:**

```bash
# En el servidor
cd /var/www/peruana-informatica/frontend

# Iniciar con PM2
pm2 start node --name "peruana-frontend" -- server.js

# Guardar
pm2 save
```

### Método 2: Vercel (Despliegue Automático)

Si prefieres una opción más simple:

1. **Crear cuenta en Vercel.com**

2. **Conectar con Git:**
   ```bash
   # Empujar código a GitHub/GitLab
   git init
   git add .
   git commit -m "Preparar para despliegue"
   git remote add origin [tu-repositorio]
   git push -u origin main
   ```

3. **Importar en Vercel:**
   - Ir a vercel.com/new
   - Importar repositorio
   - Configurar:
     - **Framework:** Next.js
     - **Root Directory:** frontend
     - **Build Command:** npm run build
     - **Output Directory:** .next
   - Agregar variables de entorno

4. **Configurar Dominio Personalizado** en Vercel dashboard

### Configurar Nginx para Frontend (VPS)

Crear archivo `/etc/nginx/sites-available/peruana-frontend`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/peruana-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 CONFIGURACIÓN DE DOMINIOS Y SSL

### Configurar DNS

En el panel de tu proveedor de dominios:

```
Tipo    Nombre    Valor                  TTL
A       @         [IP-DEL-SERVIDOR]      3600
A       www       [IP-DEL-SERVIDOR]      3600
A       api       [IP-DEL-SERVIDOR]      3600
```

### Instalar Certificado SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
sudo certbot --nginx -d api.tudominio.com

# Renovación automática ya está configurada
# Verificar:
sudo certbot renew --dry-run
```

---

## ✅ VERIFICACIÓN POST-DESPLIEGUE

### Checklist Backend

```bash
# Verificar que el servidor esté corriendo
curl https://api.tudominio.com/api/health
# Esperado: {"status":"ok"}

# Verificar base de datos
curl https://api.tudominio.com/api/categories
# Esperado: Array de categorías

# Verificar logs
pm2 logs peruana-backend
```

### Checklist Frontend

```bash
# Verificar que el sitio cargue
curl https://tudominio.com
# Esperado: HTML de la página principal

# Verificar en navegador
# 1. Abrir https://tudominio.com
# 2. Verificar que cargue el catálogo
# 3. Probar agregar producto al carrito
# 4. Verificar que console no tenga errores de CORS
```

### Pruebas Funcionales

- [ ] La tienda carga correctamente
- [ ] Los productos se muestran con imágenes
- [ ] El carrito funciona
- [ ] El checkout completa pedidos
- [ ] Los emails se envían correctamente
- [ ] El panel admin es accesible
- [ ] La sincronización con ERP funciona (si aplica)

---

## 🔧 MANTENIMIENTO

### Comandos Útiles PM2

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicación
pm2 restart peruana-backend
pm2 restart peruana-frontend

# Detener aplicación
pm2 stop peruana-backend

# Eliminar aplicación
pm2 delete peruana-backend

# Monitorizar recursos
pm2 monit
```

### Actualizar la Aplicación

```bash
# Backend
cd /var/www/peruana-informatica/backend
git pull origin main
npm ci --only=production
npm run build
pm2 restart peruana-backend

# Frontend
cd /var/www/peruana-informatica/frontend
git pull origin main
npm ci --only=production
npm run build
pm2 restart peruana-frontend
```

### Backup de Base de Datos

```bash
# Crear backup manual
mysqldump -u peruana_user -p peruana_informatica > backup_$(date +%Y%m%d).sql

# Configurar backup automático (crontab)
0 2 * * * mysqldump -u peruana_user -p[PASSWORD] peruana_informatica | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Monitoreo de Logs

```bash
# Logs del backend
tail -f /var/www/peruana-informatica/backend/logs/app.log

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de PM2
pm2 logs --lines 100
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot connect to database"

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
cat backend/.env.production | grep DATABASE

# Probar conexión manualmente
mysql -h localhost -u peruana_user -p peruana_informatica
```

### Error: "CORS policy"

Verificar en `backend/.env.production`:
```env
CORS_ORIGIN=https://tudominio.com
```

Si usas múltiples dominios, modificar en backend src:
```typescript
const allowedOrigins = [
  'https://tudominio.com',
  'https://www.tudominio.com'
];
```

### Error: "Port already in use"

```bash
# Encontrar proceso usando el puerto
sudo lsof -i :3001

# Matar proceso
sudo kill -9 [PID]

# Reiniciar aplicación
pm2 restart peruana-backend
```

### Frontend muestra error de API

1. Verificar que `NEXT_PUBLIC_API_URL` esté configurado correctamente
2. Abrir DevTools → Network y verificar las URLs de las peticiones
3. Verificar que el backend esté accesible desde el navegador

---

## 📊 OPTIMIZACIONES RECOMENDADAS

### 1. Configurar Caché en Nginx

```nginx
# Agregar al bloque server
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    # ... resto de la configuración proxy
}
```

### 2. Comprimir Respuestas

```nginx
# En nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 3. Configurar Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 4. Monitoreo con Uptime Robot

- Registrarse en uptimerobot.com (gratis)
- Configurar monitors para:
  - https://tudominio.com
  - https://api.tudominio.com/api/health

---

## 📝 NOTAS FINALES

### Archivos que NO debes subir al servidor

```
.env.local
.env.development
node_modules/
.git/
*.log
```

### Seguridad

- ✅ Cambia contraseñas por defecto
- ✅ Usa siempre HTTPS
- ✅ Mantén Node.js y dependencias actualizadas
- ✅ Configura rate limiting en el backend
- ✅ Implementa autenticación para rutas admin

### Soporte

Para dudas o problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica la documentación en `/docs`
3. Consulta esta guía

---

**Fecha de creación:** Diciembre 2025  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Peruana Informática

¡Buena suerte con el despliegue! 🚀
