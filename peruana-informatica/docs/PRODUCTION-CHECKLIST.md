# 🧹 PLAN DE LIMPIEZA Y OPTIMIZACIÓN PARA PRODUCCIÓN

## 📋 PARTE 1: ARCHIVOS A ELIMINAR

### ❌ Alta Prioridad - Eliminar AHORA

#### 1. **Carpeta `peruanadeinformatica/` - ~1,290 archivos**
   - **Razón**: Aplicación PHP antigua que ya fue migrada a Next.js + Node.js
   - **Tamaño estimado**: ~50-100 MB
   - **Acción**: `rm -rf peruanadeinformatica/`
   - **⚠️ IMPORTANTE**: Hacer backup antes si necesitas consultar algo

#### 2. **Archivos de documentación temporales en `.gemini/`**
   - `fix-product-edit.md`
   - `reset-product-flags.sql` (ya ejecutado)
   - **Acción**: Mover a `docs/` o eliminar

#### 3. **Archivos de configuración duplicados**
   - Buscar `.env.example` duplicados
   - Archivos de configuración de editores no usados

### ⚠️ Media Prioridad - Revisar antes de eliminar

#### 4. **Backend - Archivos sin usar**
   - Buscar controladores/rutas no referenciados
   - Middlewares obsoletos
   - Modelos sin relaciones

#### 5. **Frontend - Componentes sin usar**
   - Páginas de prueba
   - Componentes duplicados
   - Estilos no referenciados

### ℹ️ Baja Prioridad - Opcional

#### 6. **Cache y builds**
   - `frontend/.next/` (se regenera)
   - `backend/dist/` o `backend/build/` (se regenera)
   - `node_modules/` (se regenera con npm install)

---

## 🚀 PARTE 2: CHECKLIST DE PRODUCCIÓN

### 🔐 SEGURIDAD (CRÍTICO)

- [ ] **Variables de Entorno**
  - [ ] Crear `.env.production` separado de `.env.development`
  - [ ] Generar JWT_SECRET fuerte (mínimo 256 bits)
  - [ ] Configurar CORS con dominios de producción específicos
  - [ ] Remover credenciales hardcodeadas

- [ ] **Autenticación**
  - [ ] Implementar rate limiting en login (ya existe)
  - [ ] Agregar CAPTCHA en formularios públicos
  - [ ] Implementar refresh tokens para JWT
  - [ ] Hashear passwords con bcrypt (verificar rounds >= 10)

- [ ] **Base de Datos**
  - [ ] Cambiar credenciales de DB para producción
  - [ ] Crear usuario DB con permisos mínimos (no root)
  - [ ] Activar SSL para conexiones DB
  - [ ] Configurar backups automáticos diarios

- [ ] **Headers de Seguridad**
  - [ ] Helmet.js ya configurado (verificar)
  - [ ] HTTPS obligatorio (redirect HTTP → HTTPS)
  - [ ] Content Security Policy (CSP)
  - [ ] X-Frame-Options, X-Content-Type-Options

### ⚡ RENDIMIENTO

- [ ] **Frontend**
  - [ ] Habilitar compresión Gzip/Brotli
  - [ ] Optimizar imágenes (WebP, lazy loading)
  - [ ] Implementar CDN para assets estáticos
  - [ ] Configurar caché de Next.js
  - [ ] Code splitting adecuado
  - [ ] Eliminar `console.log()` en producción

- [ ] **Backend**
  - [ ] Implementar caché Redis/Memcached
  - [ ] Optimizar queries SQL (indexes, N+1)
  - [ ] Pagination en todos los endpoints
  - [ ] Limitar tamaño de request body
  - [ ] Implementar API rate limiting global

- [ ] **Base de Datos**
  - [ ] Crear índices en campos más consultados
  - [ ] Analizar y optimizar queries lentas
  - [ ] Connection pooling configurado

### 📊 MONITOREO Y LOGS

- [ ] **Sistema de Logs**
  - [ ] Winston/Morgan para logs estructurados
  - [ ] Separar logs por nivel (error, warn, info)
  - [ ] Rotación de logs diaria
  - [ ] Enviar errores críticos a Slack/Email

- [ ] **Métricas**
  - [ ] Implementar health check endpoint (`/health`)
  - [ ] Monitoreo de uptime (UptimeRobot, Pingdom)
  - [ ] APM (New Relic, Datadog) opcional
  - [ ] Google Analytics / Plausible en frontend

### 🧪 TESTING Y CALIDAD

- [ ] **Tests**
  - [ ] Tests unitarios para funciones críticas
  - [ ] Tests de integración para APIs principales
  - [ ] Tests E2E para flujos críticos (checkout, login)

- [ ] **CI/CD**
  - [ ] GitHub Actions / GitLab CI configurado
  - [ ] Build automático en cada push
  - [ ] Deploy automático a staging
  - [ ] Deploy manual a producción

### 📦 DESPLIEGUE

- [ ] **Backend**
  - [ ] PM2 o similar para process management
  - [ ] Configurar reverse proxy (Nginx)
  - [ ] SSL certificates (Let's Encrypt)
  - [ ] Configurar firewall (solo puertos 80, 443, SSH)

- [ ] **Frontend**
  - [ ] Vercel / Netlify / AWS S3 + CloudFront
  - [ ] Configurar dominio personalizado
  - [ ] SSL automático
  - [ ] Configurar headers de caché

- [ ] **Base de Datos**
  - [ ] Migrar a servicio cloud (AWS RDS, DigitalOcean)
  - [ ] Configurar backups automáticos
  - [ ] Habilitar SSL/TLS para conexiones
  - [ ] Monitoreo de queries lentas

### 🐛 MANEJO DE ERRORES

- [ ] **Frontend**
  - [ ] Error boundaries en React
  - [ ] Páginas de error personalizadas (404, 500)
  - [ ] Fallbacks para componentes
  - [ ] Mensajes de error user-friendly

- [ ] **Backend**
  - [ ] Error handling middleware global
  - [ ] Validación de inputs (Zod, Joi)
  - [ ] Respuestas de error estandarizadas
  - [ ] No exponer stack traces en producción

### 📝 DOCUMENTACIÓN

- [ ] **API**
  - [ ] Documentación con Swagger/OpenAPI
  - [ ] Ejemplos de peticiones/respuestas
  - [ ] Códigos de error documentados

- [ ] **Proyecto**
  - [ ] README completo con instrucciones de setup
  - [ ] Documentar variables de entorno
  - [ ] Guía de deployment
  - [ ] Changelog actualizado

### 🔄 MIGRACIÓN Y ROLLBACK

- [ ] **Plan de Migración**
  - [ ] Script de migración de datos
  - [ ] Modo mantenimiento preparado
  - [ ] Plan de rollback documentado
  - [ ] Backup completo antes de migration

---

## 🎯 QUICK WINS (Hacer YA)

### ✅ Fáciles y de Alto Impacto

1. **Eliminar carpeta PHP antigua** (5 min)
   ```bash
   rm -rf peruanadeinformatica/
   ```

2. **Limpiar console.logs** (15 min)
   ```bash
   # Buscar y eliminar console.logs
   grep -r "console.log" frontend/src --exclude-dir=node_modules
   ```

3. **Optimizar imports** (10 min)
   - Eliminar imports no usados
   - Usar barrel exports

4. **Comprimir imágenes** (20 min)
   - Convertir PNGs grandes a WebP
   - Usar herramientas como TinyPNG

5. **Configurar .gitignore** (5 min)
   - Asegurar que .env no se suba
   - Ignorar carpetas de build

---

## 📅 TIMELINE SUGERIDO

### Semana 1: Limpieza y Seguridad
- Día 1-2: Eliminar archivos innecesarios
- Día 3-4: Configurar variables de entorno de producción
- Día 5: Auditoría de seguridad básica

### Semana 2: Optimización
- Día 1-2: Optimizar frontend (imágenes, code splitting)
- Día 3-4: Optimizar backend (queries, caché)
- Día 5: Tests básicos

### Semana 3: Deploy
- Día 1-2: Configurar entorno de staging
- Día 3-4: Deploy a staging y testing
- Día 5: Deploy a producción (off-peak hours)

---

## 🚨 RIESGOS A CONSIDERAR

1. **Datos de clientes**: GDPR/compliance si aplica
2. **Downtime**: Planear ventana de mantenimiento
3 **Escalabilidad**: Preparar para crecimiento de tráfico
4. **Costo**: Calcular costos de hosting/DB en producción
5. **SSL**: Renovación automática configurada

---

## 📞 SOPORTE POST-LAUNCH

- [ ] Sistema de tickets o email de soporte
- [ ] Documentación de FAQs
- [ ] Plan de respuesta a incidentes
- [ ] Contacto de emergencia 24/7

---

**Última actualización**: 2026-01-17
**Versión**: 1.0
