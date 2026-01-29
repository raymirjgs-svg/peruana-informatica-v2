# Checklist de Validación Pre-Despliegue

Utiliza esta lista para verificar que todo está listo antes de ejecutar el despliegue final en el servidor del cliente.

## 1. Validación de Entorno Local
- [ ] **Docker Desktop**: Ejecutando correctamente (`docker ps` responde).
- [ ] **SSH**: Acceso root al servidor verificado.
- [ ] **Builds Limpios**: `docker build` no arroja errores en frontend ni backend.

## 2. Producción sin Dependencias Externas (Zero-Bandwidth)
Confirmar que el servidor **NO** necesitará descargar nada de Internet.
- [ ] **Imágenes Locales**: Las imágenes `peruana-frontend:latest` y `peruana-backend:latest` existen en local.
- [ ] **Empaquetado Correcto**: `docker save` genera un archivo `.tar` o `.tar.gz`.
- [ ] **Docker Compose Config**: El archivo `docker-compose.yml` en el servidor tiene `image: ...` y **NO** tiene `build:`.
- [ ] **Ausencia de Pull**: Confirmar que no hay `docker pull` en ningún script de arranque.
- [ ] **Ausencia de Build**: Confirmar que no hay `npm install` ni compilación en el servidor.

## 3. Validación de CORS y Dominios
Antes de subir, revisar `.env` y configuraciones.
- [ ] **ALLOWED_ORIGINS**: Apunta al dominio real (ej. `http://peruana-informatica.com`) y NO a `localhost` (salvo para pruebas).
- [ ] **NEXT_PUBLIC_API_URL**: Apunta a `/api` o a la URL pública del backend, no a `localhost:3001`.
- [ ] **Cookies**: Si usas `secure: true`, el dominio debe tener HTTPS (SSL).
- [ ] **Referencias Hardcoded**: Buscar en el código (Ctrl+Shift+F) "localhost" para asegurar que no quedaron URLs de desarrollo.

## 4. Persistencia y Estabilidad
Simular un reinicio en local antes de subir.
- [ ] **Volumen MySQL**: `mysql_data` está definido en `docker-compose.prod.yml`.
- [ ] **Prueba de Reinicio**:
    1. Levantar con `test-local.ps1`.
    2. Crear un usuario o producto de prueba.
    3. Ejecutar `docker compose down`.
    4. Ejecutar `docker compose up -d`.
    5. **Verificación**: El usuario/producto CREADO sigue existiendo.
- [ ] **Volumen Uploads**: Las imágenes subidas persisten tras el reinicio.

## 5. Simulación de Transferencia
- [ ] **Script deploy.ps1**: Ejecución de prueba genera `app-images.tar.gz` (< 500MB aprox).
- [ ] **Conexión SSH**: El script puede conectar y crear carpetas en el servidor.

---

## 🛑 CHECKLIST FINAL: GO / NO-GO

Si alguna de las siguientes respuestas es "NO", **DETENER EL DESPLIEGUE**.

1. ¿El build local compiló sin errores? **[SI / NO]**
2. ¿El archivo `.tar.gz` está generado y pesa menos de 1GB? **[SI / NO]**
3. ¿Las variables de produccion (`.env`) tienen las contraseñas reales? **[SI / NO]**
4. ¿El `docker-compose.yml` usa `image:` en lugar de `build:`? **[SI / NO]**
5. ¿Se validó la persistencia de datos (MySQL) en local? **[SI / NO]**

🟢 **SI TODO ES "SI" -> EJECUTAR DESPLIEGUE**
🔴 **SI HAY UN "NO" -> REVISAR Y CORREGIR**
