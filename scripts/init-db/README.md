# 📋 Instrucciones - Importar Base de Datos

## 🎯 Objetivo

Este directorio contiene el script de inicialización automática de MySQL que se ejecuta cuando el contenedor de Docker se inicia **por primera vez**.

---

## 📥 Cómo Importar tu Base de Datos desde XAMPP

### Paso 1: Obtén tu archivo SQL de respaldo

Si tienes un archivo `.sql` de respaldo de tu base de datos actual en XAMPP, sigue estos pasos:

1. **Copia** tu archivo SQL de respaldo (por ejemplo, `peruana_informatica.sql`)
2. **Pégalo** en esta carpeta: `scripts/init-db/`
3. **Renombra** el archivo a exactamente: `peruana_informatica.sql`

### Paso 2: Estructura esperada

```
peruana-informatica_v2/
└── scripts/
    └── init-db/
        ├── 01-init.sh          ← Script de inicialización (ya existe)
        └── peruana_informatica.sql  ← TU ARCHIVO SQL AQUÍ
```

---

## 🚀 Qué hace el script automáticamente

El script `01-init.sh` hace lo siguiente **solo en el primer inicio**:

1. ✅ Crea la base de datos `peruana_informatica`
2. ✅ Crea el usuario `peruana_user` con permisos completos
3. ✅ Si encuentra `peruana_informatica.sql`, lo importa automáticamente
4. ✅ Si NO encuentra el archivo SQL, inicia con base de datos vacía

---

## ⚠️ Importante

- **Solo se ejecuta UNA VEZ**: Cuando el contenedor MySQL se crea por primera vez
- **Si ya iniciaste Docker**: Necesitas limpiar los volúmenes para que se ejecute de nuevo:
  ```bash
  docker compose -f docker-compose.local.yml down -v
  docker compose -f docker-compose.local.yml up -d --build
  ```

---

## 🔍 Verificar que funcionó

Una vez que Docker esté corriendo, puedes verificar:

```bash
# Ver logs de MySQL
docker compose -f docker-compose.local.yml logs mysql

# Conectarte a MySQL
docker compose -f docker-compose.local.yml exec mysql mysql -uperuana_user -pperuana_password_local_2024 peruana_informatica

# Ver las tablas
SHOW TABLES;
```

---

## 🆘 ¿Sin archivo SQL?

Si no tienes un archivo SQL de respaldo, no hay problema:

1. Deja esta carpeta como está (sin el archivo `.sql`)
2. Al iniciar Docker, la base de datos se creará vacía
3. Sequelize (en el backend) creará las tablas automáticamente

---

## 📝 Notas Técnicas

- **Encoding**: El script usa `utf8mb4` para soportar emojis y caracteres especiales
- **Permisos**: El usuario `peruana_user` tiene permisos completos solo en la BD `peruana_informatica`
- **Seguridad**: La contraseña está en `.env.docker` (NO en producción)
