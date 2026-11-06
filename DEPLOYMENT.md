# Guía de Despliegue - Peruana Informática

## Información del Proyecto

| Recurso | URL/Valor |
|---------|-----------|
| **Sitio en Producción** | http://200.58.98.122 |
| **Repositorio GitHub** | https://github.com/raymirjgs-svg/peruana-informatica-v2 |
| **VPS SSH** | `ssh -p 5313 root@200.58.98.122` |

---

## Estructura de Ramas

```
main     ← Producción (lo que está en el VPS)
  │
  └── develop  ← Desarrollo (para probar cambios)
```

| Rama | Propósito | Cuándo usar |
|------|-----------|-------------|
| `main` | Código en producción | Solo cuando el cambio está probado y listo |
| `develop` | Pruebas y desarrollo | Para nuevas funcionalidades y fixes |

---

## Flujo de Trabajo

### 1. Recibir solicitud del cliente

```bash
# Asegúrate de tener los últimos cambios
git checkout develop
git pull origin develop
```

### 2. Desarrollar y probar localmente

```bash
# Hacer cambios en el código...

# Probar con Docker local
docker-compose -f docker-compose.local.yml up -d --build

# Ver logs si hay errores
docker logs peruana_frontend
docker logs peruana_backend
```

### 3. Guardar cambios en develop

```bash
# Ver qué archivos cambiaron
git status

# Agregar archivos
git add .

# Crear commit descriptivo
git commit -m "feat: descripción del cambio"

# Subir a GitHub (rama develop)
git push origin develop
```

### 4. Cuando todo funcione, pasar a producción

```bash
# Cambiar a main
git checkout main

# Traer cambios de develop
git merge develop

# Subir a GitHub
git push origin main
```

### 5. Desplegar en el VPS

```bash
# Conectar al VPS
ssh -p 5313 root@200.58.98.122

# Ir al proyecto
cd /root/peruana-informatica

# Descargar cambios
git pull origin main

# Reconstruir y reiniciar
docker compose -f docker-compose.vps.yml up -d --build

# Verificar que todo esté corriendo
docker ps
```

---

## Comandos Útiles

### Git

```bash
# Ver estado actual
git status

# Ver en qué rama estás
git branch

# Cambiar de rama
git checkout main
git checkout develop

# Ver historial de commits
git log --oneline -10

# Descartar cambios no guardados
git checkout -- archivo.tsx
```

### Docker - Local

```bash
# Iniciar todo
docker-compose -f docker-compose.local.yml up -d

# Reconstruir después de cambios
docker-compose -f docker-compose.local.yml up -d --build

# Ver logs
docker logs -f peruana_frontend
docker logs -f peruana_backend

# Parar todo
docker-compose -f docker-compose.local.yml down

# Parar y borrar volúmenes (reset completo)
docker-compose -f docker-compose.local.yml down -v
```

### Docker - VPS (Producción)

```bash
# Conectar
ssh -p 5313 root@200.58.98.122

# Ver contenedores
docker ps

# Ver logs
docker logs peruana_frontend
docker logs peruana_backend

# Reiniciar un servicio
docker compose -f docker-compose.vps.yml restart frontend
docker compose -f docker-compose.vps.yml restart nginx

# Reconstruir todo
docker compose -f docker-compose.vps.yml up -d --build
```

### Base de Datos

```bash
# Backup de la base de datos (en VPS)
docker exec peruana_mysql mysqldump -u root -p peruana_db > backup.sql

# Restaurar base de datos
docker exec -i peruana_mysql mysql -u root -p peruana_db < backup.sql

# Acceder a MySQL
docker exec -it peruana_mysql mysql -u root -p
```

---

## Estructura del Proyecto

```
peruana-informatica_v2/
├── docker-compose.local.yml    # Para desarrollo local
├── docker-compose.vps.yml      # Para producción (VPS)
├── nginx/
│   └── nginx.http.conf         # Configuración de Nginx
├── envs/
│   └── .env.production         # Variables de entorno (NO commitear)
└── peruana-informatica/
    ├── frontend/               # Next.js 15
    │   ├── src/
    │   │   ├── app/            # Páginas (App Router)
    │   │   ├── components/     # Componentes React
    │   │   └── services/       # Servicios API
    │   └── Dockerfile.prod
    └── backend/                # Express.js
        ├── src/
        │   ├── routes/         # Endpoints API
        │   └── models/         # Modelos Sequelize
        └── Dockerfile.prod
```

---

## Solución de Problemas

### El frontend no carga

```bash
# Ver logs del frontend
docker logs peruana_frontend

# Verificar que el contenedor está corriendo
docker ps | grep frontend

# Reiniciar
docker compose -f docker-compose.vps.yml restart frontend
```

### Las imágenes no se ven

```bash
# Verificar que las imágenes existen en el contenedor
docker exec peruana_backend ls /app/public/images/products/ | head

# Verificar nginx
docker logs peruana_nginx
```

### Error de base de datos

```bash
# Ver logs de MySQL
docker logs peruana_mysql

# Verificar conexión
docker exec peruana_mysql mysqladmin -u root -p ping
```

### Nginx no responde

```bash
# Reiniciar nginx
docker compose -f docker-compose.vps.yml restart nginx

# Ver configuración
docker exec peruana_nginx cat /etc/nginx/nginx.conf
```

---

## Checklist de Despliegue

Antes de pasar cambios a producción:

- [ ] Probé los cambios localmente con `docker-compose.local.yml`
- [ ] No hay errores en la consola del navegador
- [ ] Las páginas principales cargan correctamente
- [ ] El carrito de compras funciona
- [ ] Las imágenes se ven correctamente
- [ ] Hice commit con mensaje descriptivo
- [ ] Subí los cambios a GitHub

---

## Contacto y Soporte

- **Repositorio**: https://github.com/raymirjgs-svg/peruana-informatica-v2
- **Servidor VPS**: 200.58.98.122 (Puerto SSH: 5313)

---

*Última actualización: Febrero 2026*
