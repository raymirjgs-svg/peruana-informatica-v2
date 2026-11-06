# Configuración de Nginx para Peruana Informática

## 📋 Requisitos Previos

1. Tener dominio configurado apuntando al servidor
2. Docker y Docker Compose instalados
3. Certbot para certificados SSL (recomendado)

## 🔧 Configuración Básica

### 1. Reemplazar el dominio en archivos

Edita los siguientes archivos y reemplaza `midominio.com` con tu dominio real:

#### nginx/nginx.conf
```nginx
server_name TU_DOMINIO.com www.TU_DOMINIO.com; # REEMPLAZAR
# ...
ssl_certificate /etc/letsencrypt/live/TU_DOMINIO.com/fullchain.pem; # REEMPLAZAR
ssl_certificate_key /etc/letsencrypt/live/TU_DOMINIO.com/privkey.pem; # REEMPLAZAR
```

#### envs/.env.production
```bash
NEXT_PUBLIC_API_URL=https://TU_DOMINIO.com
NEXTAUTH_URL=https://TU_DOMINIO.com
FRONTEND_URL=https://TU_DOMINIO.com
ALLOWED_ORIGINS=https://TU_DOMINIO.com,http://IP_DEL_SERVIDOR
```

### 2. Configurar SSL con Let's Encrypt

#### Opción A: Automática con Certbot (Recomendado)

1. **Inicializar Certbot:**
```bash
# En el servidor
docker compose -f docker-compose.yml -f docker-compose.prod.yml up certbot --build

# Esperar a que el contenedor esté corriendo
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email TU_EMAIL@dominio.com \
  --agree-tos \
  --no-eff-email \
  -d TU_DOMINIO.com -d www.TU_DOMINIO.com
```

2. **Renovar certificados automáticamente:**
```bash
# El contenedor certbot se encarga de la renovación automática
docker compose -f docker-compose.yml -f docker-compose.prod.yml up certbot -d
```

#### Opción B: Certificados existentes

Si ya tienes certificados SSL:

1. Coloca los archivos en la carpeta correcta:
```bash
mkdir -p certbot/conf/live/TU_DOMINIO.com/
cp /ruta/a/tu/certificado/fullchain.pem certbot/conf/live/TU_DOMINIO.com/
cp /ruta/a/tu/llave/privkey.pem certbot/conf/live/TU_DOMINIO.com/
```

### 3. Verificar configuración

```bash
# Verificar sintaxis de nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t

# Reiniciar nginx con nueva configuración
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

## 🔧 Configuración Avanzada

### Rate Limiting

El archivo ya incluye rate limiting en:
- **API:** 10 peticiones/segundo por IP
- **General:** Sin límite (configurable)

### Headers de Seguridad

Configurados automáticamente:
- HSTS (solo con SSL)
- XSS Protection
- Clickjacking Protection
- Content Security Policy

### Optimizaciones

#### Gzip Compression
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

#### Timeouts
```nginx
client_body_timeout 10s;
client_header_timeout 10s;
keepalive_timeout 65;
send_timeout 10s;
```

## 🚀 Despliegue Completo

### 1. Preparar variables de entorno
```bash
# Crear archivo de producción a partir del template
cp envs/.env.production.example envs/.env.production

# Editar con tus valores reales
nano envs/.env.production
```

### 2. Iniciar servicios
```bash
# Construir y iniciar todos los servicios
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verificar estado
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 3. Verificar funcionamiento

```bash
# Health check del sistema
curl https://TU_DOMINIO.com/health

# Verificar logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

## 🛠️ Troubleshooting

### Problema: Certificados SSL no válidos
```bash
# Revisar fechas de expiración
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec certbot certbot certificates

# Forzar renovación
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec certbot certbot renew --force
```

### Problema: 502 Bad Gateway
```bash
# Verificar que backend esté corriendo
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend curl http://localhost:3001/api/health

# Revisar logs del backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Problema: Archivos estáticos no cargan
```bash
# Verificar permisos
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend ls -la /app/public/uploads/

# Reconstruir imágenes
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 📊 Monitoreo

### Logs específicos
```bash
# Nginx (access y error)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Salud de los servicios
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx wget -qO- http://localhost/health
```

### Métricas básicas
```bash
# Estadísticas de Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker stats

# Verificar límites de recursos
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -V 2>&1 | grep -o with-http_stub_status_module
```

## 🔄 Actualizaciones

Para actualizar la configuración de Nginx sin downtime:

```bash
# Testear nueva configuración
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t

# Reload de nginx sin reiniciar contenedor
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 📚 Referencias

- [Documentación oficial de Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt - Certbot](https://certbot.eff.org/)
- [Docker Compose](https://docs.docker.com/compose/)

## ⚠️ Notas Importantes

1. **Backups:** Realiza backups regulares de `certbot/conf/` y de la base de datos
2. **Dominio:** El dominio debe apuntar al servidor ANTES de generar certificados SSL
3. **Firewall:** Asegúrate de que los puertos 80 y 443 estén abiertos
4. **Logs:** Monitorea regularmente los logs para detectar problemas temprano