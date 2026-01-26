# 🔐 SEGURIDAD Y OPTIMIZACIÓN POST-DESPLIEGUE

Esta guía te ayudará a asegurar y optimizar tu aplicación después del despliegue.

---

## 🔒 SEGURIDAD

### 1. Variables de Entorno Seguras

#### ✅ Buenas Prácticas

```env
# ❌ MAL - Contraseñas débiles
DATABASE_PASSWORD=12345
JWT_SECRET=secret

# ✅ BIEN - Contraseñas fuertes
DATABASE_PASSWORD=X9k#mP2$vL8qN5@wR3!tY7
JWT_SECRET=a7f8d9e6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9
```

#### Generar Claves Seguras

**PowerShell:**
```powershell
# Generar clave aleatoria de 32 bytes
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# O usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Linux/Mac:**
```bash
# Generar clave aleatoria
openssl rand -hex 32

# O usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Protección de Archivos Sensibles

#### Nginx - Bloquear Acceso

```nginx
# En tu configuración de servidor
location ~ /\.(env|git|htaccess|htpasswd) {
    deny all;
    return 404;
}

location ~ /\.well-known {
    allow all;
}
```

#### .gitignore - No Subir Secretos

```gitignore
# Variables de entorno
.env
.env.local
.env.production
.env.*.local

# Logs
*.log
logs/
npm-debug.log*

# Archivos de sistema
.DS_Store
Thumbs.db

# Directorios
node_modules/
dist/
.next/
uploads/
```

### 3. CORS Configurado Correctamente

#### Backend (Express)

Editar `backend/src/server.ts`:

```typescript
import cors from 'cors';

// ❌ MAL - Permite todos los orígenes
app.use(cors());

// ✅ BIEN - Solo dominios específicos
const allowedOrigins = [
  'https://tudominio.com',
  'https://www.tudominio.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (apps móviles, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'El CORS policy no permite acceso desde este origen.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4. Rate Limiting (Prevenir Ataques)

#### Backend - Express Rate Limit

```typescript
import rateLimit from 'express-rate-limit';

// Limitar peticiones generales
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta más tarde.'
});

// Limitar login/registro
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 intentos
  message: 'Demasiados intentos de login, intenta en 1 hora.'
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
```

### 5. Headers de Seguridad

#### Helmet.js (Backend)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### Nginx Headers

```nginx
# Agregar en bloque server
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 6. Sanitización de Inputs

#### Backend - Express Validator

```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/orders',
  // Validar y sanitizar
  body('customer_email').isEmail().normalizeEmail(),
  body('customer_name').trim().escape(),
  body('customer_phone').trim(),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Procesar...
  }
);
```

### 7. SQL Injection Prevention

#### ✅ Usar ORM (Sequelize)

```typescript
// ✅ BIEN - Sequelize previene SQL injection
const product = await Product.findOne({
  where: { id: req.params.id }
});

// ❌ NUNCA hacer esto
const query = `SELECT * FROM products WHERE id = ${req.params.id}`;
```

### 8. Autenticación Admin

#### JWT Token

```typescript
import jwt from 'jsonwebtoken';

// Middleware de autenticación
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Proteger rutas admin
app.use('/api/admin', authenticateAdmin);
```

### 9. Backup Automático de Base de Datos

#### Script de Backup (Linux/VPS)

Crear `/root/backup-db.sh`:

```bash
#!/bin/bash

# Configuración
DB_USER="peruana_user"
DB_PASS="tu_password"
DB_NAME="peruana_informatica"
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Eliminar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: backup_$DATE.sql.gz"
```

Hacer ejecutable y programar:
```bash
chmod +x /root/backup-db.sh

# Agregar a crontab (ejecutar diariamente a las 2 AM)
crontab -e
# Agregar línea:
0 2 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

### 10. Firewall Configurado

#### UFW (Ubuntu/Debian)

```bash
# Reset (opcional)
ufw --force reset

# Políticas por defecto
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (¡importante!)
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Permitir MySQL solo desde localhost (si backend está en el mismo servidor)
# No necesario si backend usa localhost

# Habilitar
ufw enable

# Verificar
ufw status verbose
```

---

## ⚡ OPTIMIZACIÓN

### 1. Compresión Gzip

#### Nginx

```nginx
# En nginx.conf o bloque http
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/x-javascript
    application/xml
    application/xml+rss
    image/svg+xml;
```

### 2. Cache de Navegador

#### Nginx - Cache Headers

```nginx
# Imágenes
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# CSS y JavaScript
location ~* \.(css|js)$ {
    expires 7d;
    add_header Cache-Control "public, must-revalidate";
}

# Fuentes
location ~* \.(woff|woff2|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 3. Optimización de Imágenes

#### Next.js Image Component

```typescript
import Image from 'next/image';

// ✅ BIEN - Usa componente Image de Next.js
<Image
  src="/producto.jpg"
  alt="Producto"
  width={500}
  height={500}
  quality={85}
  priority={false}
  placeholder="blur"
/>

// ❌ Evitar usar <img> directamente
<img src="/producto.jpg" alt="Producto" />
```

#### Configuración Next.js

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    domains: ['api.tudominio.com'], // Si cargas imágenes externas
  },
};
```

### 4. Database Connection Pooling

#### Sequelize Configuration

```typescript
// backend/src/config/database.ts
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  pool: {
    max: 10,          // Máximo de conexiones
    min: 2,           // Mínimo de conexiones
    acquire: 30000,   // Tiempo máximo para adquirir conexión
    idle: 10000       // Tiempo antes de liberar conexión inactiva
  },
  logging: false,     // Desactivar logs en producción
});
```

### 5. Lazy Loading y Code Splitting

#### Next.js Dynamic Imports

```typescript
// Cargar componente solo cuando se necesite
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <p>Cargando...</p>,
  ssr: false // No renderizar en servidor si no es necesario
});

export default function AdminPage() {
  return <AdminPanel />;
}
```

### 6. Monitoreo de Rendimiento

#### PM2 Monitoring

```bash
# Instalación
pm2 install pm2-logrotate

# Configurar rotación de logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Monitorear
pm2 monit

# Métricas
pm2 describe peruana-backend
```

#### Logs Estructurados (Backend)

```typescript
// Usar Winston o Morgan
import morgan from 'morgan';

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### 7. CDN para Archivos Estáticos

Si el tráfico es alto, considera usar CloudFlare o AWS CloudFront:

1. **CloudFlare (Gratis):**
   - Agregar dominio a CloudFlare
   - Configurar DNS
   - Activar proxy (nube naranja)
   - Cache automático

2. **Configuración Nginx para CDN:**

```nginx
# Agregar headers para CDN
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-CDN-Cache "HIT" always;
}
```

### 8. MySQL Optimization

#### my.cnf (MySQL Configuration)

```ini
[mysqld]
# Optimizaciones básicas
max_connections = 150
query_cache_type = 1
query_cache_size = 32M
query_cache_limit = 2M

# InnoDB
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2

# Charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

#### Índices en Tablas

```sql
-- Agregar índices para mejorar consultas
ALTER TABLE products ADD INDEX idx_category (category_id);
ALTER TABLE products ADD INDEX idx_brand (brand_id);
ALTER TABLE products ADD INDEX idx_is_active (is_active);
ALTER TABLE orders ADD INDEX idx_customer_email (customer_email);
ALTER TABLE orders ADD INDEX idx_status (status);
```

### 9. Optimización de Consultas

#### Evitar N+1 Queries

```typescript
// ❌ MAL - N+1 queries
const orders = await Order.findAll();
for (const order of orders) {
  order.items = await OrderItem.findAll({ where: { order_id: order.id } });
}

// ✅ BIEN - Una sola query con include
const orders = await Order.findAll({
  include: [{ model: OrderItem }]
});
```

### 10. Análisis de Performance

#### Frontend - Lighthouse

```bash
# Usar Chrome DevTools → Lighthouse
# O instalar CLI
npm install -g lighthouse

# Analizar
lighthouse https://tudominio.com --view
```

**Métricas objetivo:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

#### Backend - Load Testing

```bash
# Instalar artillery
npm install -g artillery

# Crear test.yml
artillery quick --count 10 --num 100 https://api.tudominio.com/api/health

# O con archivo de configuración
artillery run load-test.yml
```

---

## 📊 MONITOREO CONTINUO

### 1. UptimeRobot (Gratis)

1. Crear cuenta en uptimerobot.com
2. Agregar monitors:
   - `https://tudominio.com` - HTTP(s) Monitor
   - `https://api.tudominio.com/api/health` - HTTP(s) Monitor
3. Configurar alertas por email

### 2. Google Analytics (Frontend)

Agregar en `frontend/src/app/layout.tsx`:

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Error Tracking - Sentry (Opcional)

```bash
npm install @sentry/nextjs @sentry/node
```

Configurar para capturar errores automáticamente.

---

## ✅ CHECKLIST DE SEGURIDAD

Antes de considerar la aplicación segura, verifica:

- [ ] Todas las contraseñas son seguras (min 20 caracteres aleatorios)
- [ ] HTTPS está activado y forzado
- [ ] CORS está configurado correctamente
- [ ] Rate limiting está activo
- [ ] Headers de seguridad configurados
- [ ] Archivos .env no son accesibles públicamente
- [ ] SQL injection prevenido (usando ORM)
- [ ] XSS prevenido (sanitización de inputs)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] Monitoreo activo
- [ ] Logs rotando correctamente
- [ ] Certificado SSL válido y auto-renovable

---

## ⚡ CHECKLIST DE OPTIMIZACIÓN

- [ ] Gzip/Brotli compresión habilitada
- [ ] Cache de navegador configurado
- [ ] Imágenes optimizadas (WebP, tamaños correctos)
- [ ] Code splitting implementado
- [ ] Lazy loading en componentes pesados
- [ ] Connection pooling configurado
- [ ] Índices en tablas de base de datos
- [ ] CDN configurado (si tráfico es alto)
- [ ] Lighthouse score > 90
- [ ] Tiempos de respuesta API < 200ms

---

**Recuerda:** La seguridad y optimización son procesos continuos. Revisa y actualiza regularmente.

**Última actualización:** Diciembre 2025
