# COMANDOS LISTOS PARA EJECUTAR

## 1️⃣ Validar Mejoras (Ejecutar Primero)
```powershell
powershell -ExecutionPolicy Bypass -File .\validate-improvements.ps1
```

## 2️⃣ Configurar Variables de Producción
```powershell
# Opción A: Editar manualmente
notepad .env

# Opción B: Copiar template
Copy-Item ".env.example" ".env"
# Luego editar con valores reales
```

**Variables Críticas a Cambiar en .env**:
```
ALLOWED_ORIGINS=tu-dominio-aqui.com
NEXT_PUBLIC_API_URL=/api
DB_PASSWORD=contraseña_segura_aqui
JWT_SECRET=secreto_seguro_aqui
MAIL_HOST=tu-smtp-server
MAIL_PASSWORD=tu-contraseña-email
```

## 3️⃣ Generar Imágenes Docker (Si No Existen)

### Backend
```powershell
docker build -t peruana-backend:latest `
  -f peruana-informatica/backend/Dockerfile.prod `
  peruana-informatica/backend
```

### Frontend
```powershell
docker build -t peruana-frontend:latest `
  -f peruana-informatica/frontend/Dockerfile.prod `
  peruana-informatica/frontend `
  --build-arg NEXT_PUBLIC_API_URL=/api
```

### Verificar que existen
```powershell
docker images | Select-String "peruana"
```

## 4️⃣ Validar Persistencia Local

```powershell
# Levantar ambiente de test
.\test-local.ps1

# Esperar a que cargue completamente
# Abrir navegador en: http://localhost

# Crear un usuario o producto de prueba en la app
# Luego en PowerShell:

docker compose down

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Levantar de nuevo
docker compose up -d

# Verificar en http://localhost que el dato persiste
```

## 5️⃣ Empaquetar para Transferencia (Zero-Bandwidth)

```powershell
# Guardar ambas imágenes en un archivo comprimido
docker save peruana-backend:latest peruana-frontend:latest | gzip > app-images.tar.gz

# Verificar el tamaño (debería ser < 500MB)
(Get-Item app-images.tar.gz).Length / 1MB
```

## 6️⃣ Desplegar (Opción Automática - Recomendada)

```powershell
.\deploy.ps1
```

**El script automáticamente**:
- [ ] Genera las imágenes
- [ ] Las comprime
- [ ] Las sube al servidor vía SSH
- [ ] Las carga en el servidor
- [ ] Inicia los contenedores

## 🔄 Desplegar (Opción Manual - Paso a Paso)

Ver: [PLAN_DESPLIEGUE_FINAL.md](PLAN_DESPLIEGUE_FINAL.md)

---

## 🐛 Troubleshooting Rápido

### Error: "Scripts no habilitados"
```powershell
powershell -ExecutionPolicy Bypass -File .\validate-improvements.ps1
```

### Error: "docker: not found"
```powershell
# Instalar Docker Desktop desde:
# https://www.docker.com/products/docker-desktop
```

### Error: "Port 80 already in use"
```powershell
# Ver qué está usando el puerto 80
netstat -ano | findstr :80

# Liberar puerto (si es necesario):
# Cerrar la app que lo usa o cambiar puerto en docker-compose
```

### Error: "Cannot connect to server"
```powershell
# Verificar SSH
ssh -i "ruta/a/tu/key.pem" usuario@servidor.com

# Si no funciona, verificar:
# 1. El archivo .pem existe y tiene permisos
# 2. La IP/dominio del servidor es correcto
# 3. El usuario SSH existe
```

---

## 📋 Checklist Antes de Desplegar

- [ ] Ejecuté `validate-improvements.ps1` y pasó todo
- [ ] Configuré `.env` con valores reales (NO defaults)
- [ ] Cambié `ALLOWED_ORIGINS` a mi dominio
- [ ] Cambié `DB_PASSWORD` a contraseña segura
- [ ] Cambié `JWT_SECRET` a secreto seguro
- [ ] Generé las imágenes Docker (o verifico que existen)
- [ ] Ejecuté `test-local.ps1` y validé persistencia
- [ ] Tengo acceso SSH al servidor verificado
- [ ] El servidor tiene Docker instalado

---

## ✅ Después de Desplegar

### Verificar que todo funciona
```powershell
# SSH al servidor
ssh usuario@servidor.com

# Ver logs
docker logs peruana-backend
docker logs peruana-frontend

# Ver contenedores corriendo
docker ps

# Probar conexión
curl http://localhost/health
```

### Hacer backup de la base de datos
```powershell
# En el servidor:
docker exec peruana-db mysqldump -u root -p $DB_PASSWORD $DB_NAME > backup-$(Get-Date -Format 'yyyyMMdd').sql
```

---

## 📞 Soporte

| Situación | Referencia |
|-----------|-----------|
| Entender cambios realizados | [MEJORAS_IMPLEMENTADAS.md](MEJORAS_IMPLEMENTADAS.md) |
| Guía detallada de despliegue | [PLAN_DESPLIEGUE_FINAL.md](PLAN_DESPLIEGUE_FINAL.md) |
| Resumen ejecutivo | [RESUMEN_FINAL_MEJORAS.md](RESUMEN_FINAL_MEJORAS.md) |
| Inicio rápido | [00_INICIO_RAPIDO.md](00_INICIO_RAPIDO.md) |
| Checklist original | [CHECKLIST_VALIDACION.md](CHECKLIST_VALIDACION.md) |

---

**¡Listo para desplegar!** 🚀

Próximo comando:
```powershell
.\deploy.ps1
```
