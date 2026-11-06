# Resumen de Migración de Base de Datos

## 📦 Scripts Creados

| Script | Ubicación | Propósito |
|--------|-----------|-----------|
| `backup-current-db.sh` | `scripts/` | Backup automático de BD actual |
| `migrate-database.sh` | `scripts/` | **Script principal** de migración |
| `verify-db-structure.sh` | `scripts/` | Verificar 28 tablas |
| `verify-product-data.sh` | `scripts/` | Verificar productos categorizados |
| `verify-subcategories.sh` | `scripts/` | Verificar 836 relaciones |
| `verify-blog-posts.sh` | `scripts/` | Verificar 9 posts nuevos |
| `MIGRATION_GUIDE.md` | `scripts/` | Guía completa de usuario |

## 🚀 Cómo Ejecutar

### Método Simple (Recomendado)

```bash
# 1. Dar permisos (opcional en Windows, necesario en Linux/Mac)
chmod +x scripts/*.sh

# 2. Ejecutar migración
bash scripts/migrate-database.sh
```

### Método PowerShell (Windows nativo)

Como los scripts son bash, necesitas usar **Git Bash** o **WSL**:

```powershell
# Opción 1: Git Bash (viene con Git for Windows)
"C:\Program Files\Git\bin\bash.exe" scripts/migrate-database.sh

# Opción 2: WSL (si lo tienes instalado)
wsl bash scripts/migrate-database.sh
```

## ✅ Verificación Rápida

Después de la migración, ejecuta:

```bash
bash scripts/verify-db-structure.sh    # ¿Están las 28 tablas?
bash scripts/verify-product-data.sh    # ¿Productos categorizados?
bash scripts/verify-subcategories.sh   # ¿836 relaciones OK?
bash scripts/verify-blog-posts.sh      # ¿9 posts nuevos?
```

## 📝 Notas Importantes

### ⚠️ Antes de Migrar

- Los datos actuales serán **reemplazados completamente**
- Se creará un backup automático antes de la migración
- La BD optimizada es del **02-02-2026** (hace 2 semanas)
- El script te pedirá confirmación antes de proceder

### ✅ Qué Incluye la BD Optimizada

- **1,191 productos** con categorías asignadas (100%)
- **836 relaciones** producto-subcategoría
- **9 artículos nuevos** de blog sobre gaming/tecnología
- **Misma estructura** (sin breaking changes)

### 🔄 Rollback

Los backups se guardan en `./backups/` con timestamp.

Para restaurar:
```bash
gunzip -c backups/ARCHIVO_BACKUP.sql.gz | \
  docker exec -i peruana-informatica_v2-mysql-1 mysql \
  -u root -prootpassword123 peruanainformatica
```

## 🎯 Próximos Pasos

1. ✅ **Scripts listos** - Todos los scripts están creados
2. ⏭️ **Ejecutar** - Corre `migrate-database.sh` cuando estés listo
3. ✔️ **Verificar** - Usa los scripts de verificación
4. 🌐 **Probar** - Abre la web y prueba categorías, blog, etc.

## 📞 Si Algo Sale Mal

1. Los backups están en `./backups/` con timestamp
2. Revisa logs: `docker-compose logs -f mysql`
3. Restaura desde backup usando el comando de rollback arriba
4. Revisa `MIGRATION_GUIDE.md` para más detalles

---

**¡Todo listo para migrar!** El proceso toma ~10 minutos y es completamente automático. 🚀
