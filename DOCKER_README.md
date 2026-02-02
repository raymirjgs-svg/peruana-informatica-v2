# 🐳 Guía de Desarrollo Local con Docker

## 🎯 Objetivo

Esta guía te permite ejecutar **Peruana Informática** completamente en Docker, sin necesidad de XAMPP ni configuraciones manuales.

---

## 📋 Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado
- **NO necesitas**: XAMPP, MySQL, Node.js instalados localmente

---

## 🚀 Inicio Rápido (3 Pasos)

### 1️⃣ (Opcional) Importar tu Base de Datos

Si tienes un archivo `.sql` de respaldo de XAMPP:

```bash
# Coloca tu archivo SQL aquí y renómbralo:
scripts/init-db/peruana_informatica.sql
```

Ver instrucciones completas en: [`scripts/init-db/README.md`](./scripts/init-db/README.md)

### 2️⃣ Iniciar Docker

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Este comando:
- ✅ Descarga las imágenes de MySQL, Redis, Node.js
- ✅ Construye los contenedores de Backend y Frontend
- ✅ Crea la base de datos automáticamente
- ✅ Importa tu archivo `.sql` (si existe)
- ✅ Inicia todos los servicios

### 3️⃣ Acceder a la Aplicación

Una vez que los contenedores estén corriendo:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:3000/admin

---

## 📊 Verificar que Todo Funciona

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose -f docker-compose.local.yml logs -f

# Solo MySQL
docker compose -f docker-compose.local.yml logs -f mysql

# Solo Backend
docker compose -f docker-compose.local.yml logs -f backend

# Solo Frontend
docker compose -f docker-compose.local.yml logs -f frontend
```

### Verificar Estado de los Contenedores

```bash
docker compose -f docker-compose.local.yml ps
```

Deberías ver todos los servicios con estado **"healthy"** después de 1-2 minutos.

### Probar la API

```bash
# Healthcheck
curl http://localhost:3001/api/health

# Listar productos
curl http://localhost:3001/api/products
```

---

## 🗄️ Trabajar con la Base de Datos

### Conectarse a MySQL

```bash
# Desde el contenedor
docker compose -f docker-compose.local.yml exec mysql mysql -uperuana_user -pperuana_password_local_2024 peruana_informatica

# Ver tablas
SHOW TABLES;

# Salir
EXIT;
```

### Importar/Exportar Datos

```bash
# Exportar base de datos
docker compose -f docker-compose.local.yml exec mysql mysqldump -uperuana_user -pperuana_password_local_2024 peruana_informatica > backup.sql

# Importar base de datos
docker compose -f docker-compose.local.yml exec -T mysql mysql -uperuana_user -pperuana_password_local_2024 peruana_informatica < backup.sql
```

---

## 🔄 Hot-Reload (Desarrollo)

**El código se recarga automáticamente** cuando haces cambios:

- **Backend**: Cambios en `backend/src/**` → Servidor se reinicia automáticamente
- **Frontend**: Cambios en `frontend/src/**` → Página se recarga automáticamente con Turbopack

No necesitas reiniciar Docker para ver tus cambios.

---

## 🛠️ Comandos Útiles

### Detener los Contenedores

```bash
# Detener sin eliminar datos
docker compose -f docker-compose.local.yml stop

# Detener y eliminar contenedores (los datos se mantienen)
docker compose -f docker-compose.local.yml down
```

### Reiniciar los Contenedores

```bash
# Reiniciar todos
docker compose -f docker-compose.local.yml restart

# Reiniciar solo el backend
docker compose -f docker-compose.local.yml restart backend
```

### Limpiar Todo y Empezar de Nuevo

```bash
# ⚠️ ADVERTENCIA: Esto elimina TODOS los datos de la base de datos
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
```

### Ver Uso de Recursos

```bash
docker stats
```

---

## 🐛 Solución de Problemas

### El Backend no Conecta a MySQL

**Problema**: `SequelizeConnectionError: Access denied`

**Solución**:
```bash
# Limpiar volúmenes y reiniciar
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
```

### Puerto 3000 o 3001 ya está en Uso

**Problema**: `Error: bind: address already in use`

**Solución 1** - Matar el proceso:
```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Solución 2** - Cambiar el puerto en `.env.docker`:
```env
# Cambiar puertos
PORT=3002  # Backend
```

Y actualizar `docker-compose.local.yml`:
```yaml
backend:
  ports:
    - "3002:3001"  # Host:Container
```

### El Frontend Muestra "Cannot connect to API"

**Verificar**:
1. El backend está corriendo: `docker compose -f docker-compose.local.yml ps`
2. El healthcheck del backend está OK
3. La variable `NEXT_PUBLIC_API_URL` en `.env.docker` es correcta

### Espacio en Disco Lleno

```bash
# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes no usados
docker volume prune
```

---

## 📁 Estructura del Proyecto Docker

```
peruana-informatica_v2/
├── .env.docker                    # Variables de entorno para Docker
├── docker-compose.local.yml       # Configuración de servicios Docker
├── scripts/
│   └── init-db/
│       ├── 01-init.sh            # Script de inicialización MySQL
│       ├── README.md             # Instrucciones para importar SQL
│       └── peruana_informatica.sql  # TU ARCHIVO SQL AQUÍ (opcional)
├── peruana-informatica/
│   ├── backend/
│   │   ├── Dockerfile            # Imagen Docker del backend
│   │   └── src/                  # Código fuente
│   └── frontend/
│       ├── Dockerfile            # Imagen Docker del frontend
│       └── src/                  # Código fuente
└── DOCKER_README.md              # Este archivo
```

---

## 🌐 Variables de Entorno

Todas las variables de entorno están centralizadas en **`.env.docker`**:

- **MySQL**: Credenciales y configuración
- **Backend**: Puerto, JWT, CORS, Email, APIs externas
- **Frontend**: URL de la API, NextAuth
- **Redis**: Cache (opcional)

**No necesitas** crear archivos `.env` por separado. Docker usa `.env.docker` automáticamente.

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Las contraseñas en `.env.docker` son SOLO para desarrollo local:

```env
MYSQL_ROOT_PASSWORD=root_password_local_2024      # ✅ OK para local
MYSQL_PASSWORD=peruana_password_local_2024        # ✅ OK para local
```

**NUNCA** uses estas contraseñas en producción.

---

## 📦 Volúmenes Persistentes

Docker crea 2 volúmenes que persisten tus datos:

1. **`mysql_data_local`**: Datos de MySQL (tablas, registros)
2. **`uploads_data_local`**: Archivos subidos (imágenes, documentos)

Estos volúmenes **NO se eliminan** cuando detienes los contenedores con `docker compose down`.

Solo se eliminan con: `docker compose down -v`

---

## 🆘 Soporte

Si tienes problemas:

1. **Ver logs**: `docker compose -f docker-compose.local.yml logs -f`
2. **Verificar salud**: `docker compose -f docker-compose.local.yml ps`
3. **Reiniciar limpio**: `docker compose -f docker-compose.local.yml down -v && docker compose -f docker-compose.local.yml up -d --build`

---

## 📚 Documentación Adicional

- [Documentación Original del Proyecto](./README.md)
- [Instrucciones de Importación SQL](./scripts/init-db/README.md)
- [Documentación Técnica](./docs/technical/)

---

**Versión Docker**: 1.0  
**Última actualización**: Febrero 2026
