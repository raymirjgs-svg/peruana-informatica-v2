# ✅ CHECKLIST DE DESPLIEGUE

Usa esta lista para asegurarte de completar todos los pasos necesarios antes y durante el despliegue.

---

## 📋 ANTES DEL DESPLIEGUE

### Información del Cliente

- [ ] Obtener credenciales de acceso al hosting
  - [ ] Usuario SSH / cPanel
  - [ ] Contraseña o clave SSH
  - [ ] IP del servidor o dominio
- [ ] Confirmar tipo de hosting (Shared / VPS / Cloud)
- [ ] Verificar versión de Node.js disponible (mínimo 18.x)
- [ ] Obtener credenciales de base de datos MySQL
  - [ ] Host
  - [ ] Nombre de la base de datos
  - [ ] Usuario
  - [ ] Contraseña
- [ ] Confirmar dominio(s) a usar
  - [ ] Dominio principal: ________________
  - [ ] Subdominio API: ________________
- [ ] Obtener credenciales de email SMTP
  - [ ] Host SMTP
  - [ ] Puerto
  - [ ] Usuario
  - [ ] Contraseña / App Password
- [ ] Obtener token del ERP del cliente (si aplica)
  - [ ] URL API: ________________
  - [ ] Token: ________________

---

## 🛠️ PREPARACIÓN LOCAL

### Backend

- [ ] Navegar a la carpeta backend
- [ ] Crear archivo `.env.production` con las variables correctas
- [ ] Instalar dependencias: `npm ci --only=production`
- [ ] Compilar TypeScript: `npm run build`
- [ ] Verificar que la carpeta `dist/` se creó correctamente
- [ ] Probar localmente: `NODE_ENV=production npm start`
- [ ] Verificar que no hay errores en consola

### Frontend

- [ ] Navegar a la carpeta frontend
- [ ] Crear archivo `.env.production` con las variables correctas
- [ ] Modificar `next.config.mjs` para agregar `output: 'standalone'`
- [ ] Instalar dependencias: `npm ci --only=production`
- [ ] Construir para producción: `npm run build`
- [ ] Verificar que la carpeta `.next/` se creó correctamente
- [ ] Probar localmente: `npm start`
- [ ] Verificar en el navegador que todo funciona

### Base de Datos

- [ ] Exportar estructura de la base de datos (si existe)
  ```bash
  mysqldump -u root -p --no-data peruana_informatica > estructura.sql
  ```
- [ ] Exportar datos iniciales (categorías, marcas, etc.)
  ```bash
  mysqldump -u root -p --no-create-info peruana_informatica categories brands > datos_iniciales.sql
  ```

### Documentos

- [ ] Verificar que existe `GUIA_DESPLIEGUE.md`
- [ ] Verificar que existe `README.md`
- [ ] Preparar documentación de credenciales (guardar de forma segura)

---

## 📤 SUBIDA DE ARCHIVOS

### Método 1: FTP/SFTP (Hosting Compartido)

- [ ] Conectar con FileZilla / WinSCP al servidor
- [ ] Crear carpeta raíz del proyecto en el servidor
- [ ] Subir carpeta `backend/` completa
  - [ ] Excluir `node_modules/`
  - [ ] Excluir archivos `.env.local` o `.env.development`
  - [ ] Incluir `.env.production`
- [ ] Subir carpeta `frontend/` completa
  - [ ] Excluir `node_modules/`
  - [ ] Excluir archivos `.env.local` o `.env.development`
  - [ ] Incluir `.env.production`

### Método 2: Git (VPS/Cloud)

- [ ] Crear repositorio Git (GitHub/GitLab)
- [ ] Agregar archivos al repositorio
  ```bash
  git add .
  git commit -m "Preparar para despliegue"
  git push origin main
  ```
- [ ] Conectar al servidor vía SSH
- [ ] Clonar repositorio en el servidor
  ```bash
  git clone [URL_REPOSITORIO] /var/www/peruana-informatica
  ```

### Método 3: Rsync (VPS/Cloud)

- [ ] Sincronizar backend
  ```bash
  rsync -avz --exclude 'node_modules' ./peruana-informatica/backend/ usuario@servidor:/var/www/peruana-informatica/backend/
  ```
- [ ] Sincronizar frontend
  ```bash
  rsync -avz --exclude 'node_modules' ./peruana-informatica/frontend/ usuario@servidor:/var/www/peruana-informatica/frontend/
  ```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### cPanel (Hosting Compartido)

- [ ] Iniciar sesión en cPanel
- [ ] Ir a "MySQL® Databases"
- [ ] Crear base de datos: `peruana_informatica`
- [ ] Crear usuario MySQL
- [ ] Generar contraseña segura
- [ ] Asignar usuario a la base de datos con todos los privilegios
- [ ] Anotar credenciales:
  - Host: ________________
  - Nombre DB: ________________
  - Usuario: ________________
  - Contraseña: ________________

### SSH (VPS/Cloud)

- [ ] Conectar al servidor vía SSH
- [ ] Acceder a MySQL: `mysql -u root -p`
- [ ] Crear base de datos
  ```sql
  CREATE DATABASE peruana_informatica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- [ ] Crear usuario
  ```sql
  CREATE USER 'peruana_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
  ```
- [ ] Otorgar privilegios
  ```sql
  GRANT ALL PRIVILEGES ON peruana_informatica.* TO 'peruana_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Importar Estructura y Datos

- [ ] Importar estructura
  ```bash
  mysql -h [HOST] -u [USUARIO] -p peruana_informatica < estructura.sql
  ```
- [ ] Importar datos iniciales
  ```bash
  mysql -h [HOST] -u [USUARIO] -p peruana_informatica < datos_iniciales.sql
  ```

---

## 🖥️ INSTALACIÓN DEL BACKEND

### Hosting Compartido con cPanel

- [ ] Ir a cPanel → "Setup Node.js App"
- [ ] Crear nueva aplicación con estos datos:
  - Node.js version: 18.x o superior
  - Application mode: Production
  - Application root: `backend`
  - Application startup file: `dist/server.js`
  - Environment variables: Copiar desde `.env.production`
- [ ] Entrar al terminal de la aplicación
- [ ] Instalar dependencias: `npm ci --only=production`
- [ ] Iniciar aplicación
- [ ] Verificar que esté corriendo

### VPS/Cloud con PM2

- [ ] Conectar al servidor vía SSH
- [ ] Navegar a la carpeta del backend
  ```bash
  cd /var/www/peruana-informatica/backend
  ```
- [ ] Instalar dependencias
  ```bash
  npm ci --only=production
  ```
- [ ] Compilar (si no lo hiciste antes)
  ```bash
  npm run build
  ```
- [ ] Instalar PM2 globalmente
  ```bash
  sudo npm install -g pm2
  ```
- [ ] Iniciar aplicación con PM2
  ```bash
  pm2 start dist/server.js --name "peruana-backend" -i max
  ```
- [ ] Guardar configuración de PM2
  ```bash
  pm2 save
  ```
- [ ] Configurar PM2 para inicio automático
  ```bash
  pm2 startup
  # Ejecutar el comando que PM2 te muestra
  ```
- [ ] Verificar que esté corriendo
  ```bash
  pm2 status
  pm2 logs peruana-backend
  ```

---

## 🌐 INSTALACIÓN DEL FRONTEND

### Hosting Compartido con cPanel

- [ ] Ir a cPanel → "Setup Node.js App"
- [ ] Crear nueva aplicación:
  - Node.js version: 18.x o superior
  - Application mode: Production
  - Application root: `frontend`
  - Application startup file: `server.js` (si usaste standalone)
  - Environment variables: Copiar desde `.env.production`
- [ ] Entrar al terminal
- [ ] Instalar dependencias: `npm ci --only=production`
- [ ] Iniciar aplicación

### VPS/Cloud con PM2

- [ ] Navegar a la carpeta del frontend
  ```bash
  cd /var/www/peruana-informatica/frontend
  ```
- [ ] Instalar dependencias
  ```bash
  npm ci --only=production
  ```
- [ ] Construir (si no lo hiciste antes)
  ```bash
  npm run build
  ```
- [ ] Iniciar con PM2
  ```bash
  pm2 start npm --name "peruana-frontend" -- start
  # O si usaste standalone:
  pm2 start server.js --name "peruana-frontend"
  ```
- [ ] Guardar configuración
  ```bash
  pm2 save
  ```

### Alternativa: Despliegue en Vercel

- [ ] Crear cuenta en vercel.com
- [ ] Conectar repositorio de GitHub/GitLab
- [ ] Importar proyecto
- [ ] Configurar:
  - Framework Preset: Next.js
  - Root Directory: `frontend`
  - Build Command: `npm run build`
- [ ] Agregar variables de entorno en Vercel dashboard
- [ ] Verificar despliegue exitoso

---

## 🔧 CONFIGURACIÓN DEL SERVIDOR WEB

### Nginx (VPS/Cloud)

#### Para la API (Backend)

- [ ] Crear archivo de configuración
  ```bash
  sudo nano /etc/nginx/sites-available/peruana-api
  ```
- [ ] Pegar configuración del archivo GUIA_DESPLIEGUE.md
- [ ] Activar sitio
  ```bash
  sudo ln -s /etc/nginx/sites-available/peruana-api /etc/nginx/sites-enabled/
  ```
- [ ] Verificar configuración
  ```bash
  sudo nginx -t
  ```
- [ ] Reiniciar Nginx
  ```bash
  sudo systemctl restart nginx
  ```

#### Para el Frontend

- [ ] Crear archivo de configuración
  ```bash
  sudo nano /etc/nginx/sites-available/peruana-frontend
  ```
- [ ] Pegar configuración del archivo GUIA_DESPLIEGUE.md
- [ ] Activar sitio
  ```bash
  sudo ln -s /etc/nginx/sites-available/peruana-frontend /etc/nginx/sites-enabled/
  ```
- [ ] Verificar configuración
  ```bash
  sudo nginx -t
  ```
- [ ] Reiniciar Nginx
  ```bash
  sudo systemctl restart nginx
  ```

### Apache (Hosting Compartido)

- [ ] Crear/editar archivo `.htaccess` en la raíz
- [ ] Configurar proxy reverso (si es posible)
- [ ] Configurar redirecciones si es necesario

---

## 🌍 CONFIGURACIÓN DE DNS

- [ ] Iniciar sesión en el panel del proveedor de dominio
- [ ] Ir a configuración DNS
- [ ] Agregar/Modificar registros:
  - [ ] Tipo A → `@` → IP del servidor
  - [ ] Tipo A → `www` → IP del servidor
  - [ ] Tipo A → `api` → IP del servidor
- [ ] Guardar cambios
- [ ] Esperar propagación DNS (puede tomar hasta 48 horas)
- [ ] Verificar con: `nslookup tudominio.com`

---

## 🔒 CERTIFICADO SSL

### Con Let's Encrypt (VPS/Cloud)

- [ ] Instalar Certbot
  ```bash
  sudo apt install certbot python3-certbot-nginx
  ```
- [ ] Obtener certificado para dominio principal
  ```bash
  sudo certbot --nginx -d tudominio.com -d www.tudominio.com
  ```
- [ ] Obtener certificado para API
  ```bash
  sudo certbot --nginx -d api.tudominio.com
  ```
- [ ] Verificar renovación automática
  ```bash
  sudo certbot renew --dry-run
  ```

### Con cPanel (Hosting Compartido)

- [ ] Ir a cPanel → "SSL/TLS"
- [ ] Usar "AutoSSL" o "Let's Encrypt"
- [ ] Verificar que los dominios tengan certificado activo
- [ ] Forzar HTTPS en configuración

---

## ✅ PRUEBAS POST-DESPLIEGUE

### Backend

- [ ] Verificar que el servidor responda
  ```bash
  curl https://api.tudominio.com/api/health
  ```
  Esperado: `{"status":"ok"}`
  
- [ ] Probar endpoint de categorías
  ```bash
  curl https://api.tudominio.com/api/categories
  ```
  
- [ ] Verificar logs sin errores
  ```bash
  pm2 logs peruana-backend --lines 50
  ```

### Frontend

- [ ] Abrir en navegador: `https://tudominio.com`
- [ ] Verificar que la página principal carga
- [ ] Verificar que los productos se muestran
- [ ] Abrir DevTools y verificar:
  - [ ] No hay errores en Console
  - [ ] Las peticiones a la API funcionan (Network tab)
  - [ ] No hay errores de CORS

### Flujo de Compra

- [ ] Agregar producto al carrito
- [ ] Ir al checkout
- [ ] Completar formulario de cliente
- [ ] Seleccionar método de pago
- [ ] Crear pedido
- [ ] Verificar que llegue email de confirmación
- [ ] Verificar que el pedido aparezca en la base de datos

### Panel de Administración

- [ ] Acceder a `/admin`
- [ ] Verificar login (si está implementado)
- [ ] Probar CRUD de productos
- [ ] Probar gestión de pedidos
- [ ] Verificar que la sincronización con ERP funciona (si aplica)

---

## 📧 CONFIGURACIÓN DE EMAILS

- [ ] Verificar que `SMTP_*` en `.env.production` sea correcto
- [ ] Probar envío de email de prueba
- [ ] Verificar que emails no caigan en spam
- [ ] Configurar SPF y DKIM en DNS (recomendado)

---

## 🔐 SEGURIDAD

- [ ] Verificar que `.env` no esté accesible públicamente
- [ ] Confirmar que solo HTTPS esté habilitado
- [ ] Verificar que las contraseñas sean seguras
- [ ] Configurar firewall (VPS)
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Desactivar listado de directorios
- [ ] Configurar rate limiting en backend (si no está)

---

## 📊 MONITOREO

- [ ] Configurar monitoreo de uptime
  - Opción 1: UptimeRobot (gratis)
  - Opción 2: Pingdom
  - [ ] Agregar monitor para `https://tudominio.com`
  - [ ] Agregar monitor para `https://api.tudominio.com/api/health`

- [ ] Configurar alertas por email
- [ ] Configurar backup automático de base de datos
  ```bash
  # Agregar a crontab
  0 2 * * * mysqldump -u peruana_user -p[PASSWORD] peruana_informatica | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
  ```

---

## 📝 DOCUMENTACIÓN PARA EL CLIENTE

- [ ] Crear documento con credenciales (guardar de forma segura)
  - [ ] Acceso al servidor
  - [ ] Acceso a base de datos
  - [ ] Credenciales de email
  - [ ] Acceso al panel admin
  
- [ ] Entregar archivos de documentación:
  - [ ] GUIA_DESPLIEGUE.md
  - [ ] README.md
  - [ ] INSTRUCCIONES_INSTALACION.md

- [ ] Crear manual de usuario para panel admin
- [ ] Hacer video tutorial (opcional pero recomendado)
- [ ] Agendar sesión de capacitación con el cliente

---

## 🎉 FINALIZACIÓN

- [ ] Verificar todos los items de esta checklist
- [ ] Hacer prueba completa de flujo end-to-end
- [ ] Solicitar feedback del cliente
- [ ] Documentar cualquier configuración personalizada
- [ ] Entregar proyecto oficialmente

---

## 📞 INFORMACIÓN DE SOPORTE

**En caso de problemas, revisar:**
1. Logs del servidor: `pm2 logs`
2. Logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Estado de servicios: `pm2 status`
4. GUIA_DESPLIEGUE.md → Sección "Solución de Problemas"

**Contacto de emergencia:**
- Email: ____________________
- Teléfono: __________________

---

**Fecha de despliegue:** ____/____/____  
**Responsable:** ____________________  
**Versión desplegada:** 1.0

¡Éxito en el despliegue! 🚀
