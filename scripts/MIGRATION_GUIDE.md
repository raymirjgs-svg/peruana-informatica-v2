# Guía de Migración de Base de Datos

## 📋 Resumen

Esta guía te ayudará a migrar tu base de datos Docker actual a la versión optimizada proporcionada por el cliente.

## ✅ Pre-requisitos

- Docker y Docker Compose instalados
- Git Bash o WSL para ejecutar scripts bash
- Acceso al archivo `peruana_informatica._optimizada.sql`
- Backup manual (opcional, pero recomendado)

## 🚀 Proceso de Migración Rápido

### Paso 1: Dar permisos de ejecución a los scripts

```bash
# En Git Bash o WSL
cd /c/Users/LENOVO/Desktop/Proyectos/Desplegar/peruana-informatica_v2

chmod +x scripts/*.sh
```

### Paso 2: Ejecutar la migración

```bash
# Este script hace todo automáticamente:
# 1. Backup de BD actual
# 2. Detiene servicios
# 3. Importa BD optimizada
# 4. Verifica importación
# 5. Reinicia servicios

bash scripts/migrate-database.sh
```

**Eso es todo!** El script te guiará paso a paso.

---

## 📚 Documentación Detallada

### Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `backup-current-db.sh` | Crea backup de la BD actual (SQL + Volumen opcional) |
| `migrate-database.sh` | **Script principal** - Ejecuta migración completa |
| `verify-db-structure.sh` | Verifica que las 28 tablas existan |
| `verify-product-data.sh` | Verifica productos y categorización |
| `verify-subcategories.sh` | Verifica relaciones producto-subcategoría |
| `verify-blog-posts.sh` | Verifica los nuevos posts del blog |

### Proceso Manual (Si prefieres control total)

#### 1. Backup Manual

```bash
# Opción A: Solo SQL
bash scripts/backup-current-db.sh

# Opción B: Backup directo con Docker
docker exec peruana-informatica_v2-mysql-1 mysqldump \
  -u root -prootpassword123 \
  peruanainformatica > backup_manual.sql
```

#### 2. Detener Servicios

```bash
docker-compose stop frontend backend nginx
```

#### 3. Importar BD Optimizada

```bash
# Borrar BD actual y recrear
docker exec peruana-informatica_v2-mysql-1 mysql \
  -u root -prootpassword123 \
  -e "DROP DATABASE IF EXISTS peruanainformatica; CREATE DATABASE peruanainformatica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar BD optimizada
docker exec -i peruana-informatica_v2-mysql-1 mysql \
  -u root -prootpassword123 \
  peruanainformatica < peruana_informatica._optimizada.sql
```

#### 4. Reiniciar Servicios

```bash
docker-compose up -d
```

---

## 🔍 Verificación

### Verificación Automática

```bash
# Ejecutar todos los scripts de verificación
bash scripts/verify-db-structure.sh
bash scripts/verify-product-data.sh
bash scripts/verify-subcategories.sh
bash scripts/verify-blog-posts.sh
```

### Verificación Manual

1. **Página Web**: Abrir `http://localhost` y verificar que cargue
2. **Categorías**: Verificar que el menú de categorías funcione
3. **Productos**: Buscar y filtrar productos
4. **Blog**: Navegar a `/blog` y verificar los 9 nuevos artículos
5. **Admin**: Entrar al panel y verificar productos/categorías

---

## 🔄 Rollback (En caso de problemas)

### Opción 1: Restaurar desde Backup SQL

```bash
# Detener servicios
docker-compose stop frontend backend

# Recrear base de datos
docker exec peruana-informatica_v2-mysql-1 mysql \
  -u root -prootpassword123 \
  -e "DROP DATABASE peruanainformatica; CREATE DATABASE peruanainformatica;"

# Restaurar desde backup
gunzip -c backups/peruana_informatica_backup_TIMESTAMP.sql.gz | \
  docker exec -i peruana-informatica_v2-mysql-1 mysql \
  -u root -prootpassword123 peruanainformatica

# Reiniciar
docker-compose up -d
```

### Opción 2: Restaurar Volumen Completo

```bash
# Detener todo
docker-compose down

# Restaurar volumen
docker run --rm \
  -v peruana-informatica_v2_mysql_data:/var/lib/mysql \
  -v $(pwd)/backups:/backup \
  alpine \
  sh -c "rm -rf /var/lib/mysql/* && tar -xzf /backup/mysql_volume_TIMESTAMP.tar.gz -C /var/lib/mysql"

# Reiniciar
docker-compose up -d
```

---

## ⚠️ Problemas Comunes

### Error: "Container not running"

```bash
# Iniciar solo MySQL primero
docker-compose up -d mysql

# Esperar 10 segundos y reintentar
```

### Error: "Access denied"

Verificar variables de entorno en `.env`:
```bash
MYSQL_ROOT_PASSWORD=rootpassword123
MYSQL_DATABASE=peruanainformatica
MYSQL_USER=peruana_user
MYSQL_PASSWORD=peruana_pass123
```

### Error: "Cannot connect to database"

```bash
# Ver logs de MySQL
docker logs peruana-informatica_v2-mysql-1

# Entrar al contenedor
docker exec -it peruana-informatica_v2-mysql-1 bash
mysql -u root -p
```

---

## 📊 Qué Cambió en la BD Optimizada

- ✅ **1,191 productos** con categorías asignadas
- ✅ **836 relaciones** producto-subcategoría
- ✅ **9 nuevos artículos** de blog sobre gaming/tech
- ✅ **Misma estructura** (28 tablas, sin breaking changes)
- ⚠️ **Datos del 02-02-2026** (hace 2 semanas)

---

## 💡 Consejos

1. **Ejecuta en horario de baja demanda** para minimizar impacto
2. **Guarda los backups** por al menos 1 semana
3. **Prueba primero en desarrollo** si tienes ambiente separado
4. **Monitorea los logs** las primeras 24 horas
5. **Comunica a usuarios** si hay mantenimiento programado

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica backups en directorio `./backups`
3. Ejecuta scripts de verificación
4. Consulta el `implementation_plan.md` para detalles técnicos

---

## ✨ Resultado Esperado

Después de la migración tendrás:

- ✅ Todos los productos categorizados correctamente
- ✅ Sistema de subcategorías funcionando
- ✅ Blog con contenido profesional de tecnología
- ✅ Mejora en filtros y búsqueda de productos
- ✅ Base de datos limpia y optimizada

**¡Éxito en tu migración!** 🚀
