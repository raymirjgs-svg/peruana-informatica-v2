# Estrategia de Backup y Restauración de Desastres

Este documento detalla cómo proteger y recuperar los datos críticos del sistema `peruana-informatica_v2`.

## 1. Arquitectura de Respaldo

El sistema utiliza un contenedor dedicado (`backup`) en la arquitectura Docker de producción que ejecuta un proceso automático.

*   **Frecuencia**: Diaria (cada 24 horas).
*   **Retención**: 7 días (rotación automática, elimina antiguos).
*   **Ubicación**: Los backups se guardan en la carpeta `./backups` del host.
*   **Contenido**:
    1.  `db_TIMESTAMP.sql.gz`: Dump completo de MySQL (comprimido).
    2.  `uploads_TIMESTAMP.tar.gz`: Archivo comprimido de todas las imágenes de productos.

---

## 2. Procedimiento de Restauración (Disaster Recovery)

⚠️ **ADVERTENCIA**: Estos comandos sobrescriben los datos actuales. Úsalos con precaución.

### A. Restaurar Base de Datos (MySQL)

1.  **Identificar el backup**:
    Localiza el archivo `.sql.gz` que deseas restaurar en la carpeta `./backups`.

2.  **Detener aplicaciones**:
    Para evitar inconsistencias, detén el backend mientras restauras.
    ```bash
    docker compose stop backend
    ```

3.  **Ejecutar restauración**:
    Reemplaza `db_2026xxxx.sql.gz` con tu archivo real.
    *(Este comando inyecta el SQL descomprimido directamente al contenedor MySQL)*
    ```bash
    zcat ./backups/db_2026xxxx.sql.gz | docker compose exec -T mysql mysql -u peruana_user -psecret_password_secure peruana_informatica
    ```
    *Nota: Si estás en Windows PowerShell, `zcat` podría no existir. Usa `7z` o descomprime primero manualmente.*

4.  **Reiniciar backend**:
    ```bash
    docker compose start backend
    ```

### B. Restaurar Archivos (Uploads)

1.  **Ejecutar restauración**:
    Este comando usa un contenedor temporal para extraer los archivos en el volumen `uploads_data`.
    ```bash
    docker run --rm \
      -v ${PWD}/backups:/backups \
      -v peruana-informatica_v2_uploads_data:/dest \
      alpine \
      tar -xzf /backups/uploads_2026xxxx.tar.gz -C /dest --strip-components=2
    ```
    *Nota: Verifica el nombre exacto del volumen con `docker volume ls` si falla.*

---

## 3. Checklist de Validación de Backup

Para confirmar que un backup es válido sin romper producción:

1.  **Levantar entorno Staging** limpio.
2.  **Restaurar el backup** en Staging siguiendo los pasos anteriores.
3.  **Verificar integridad**:
    *   ¿La aplicación carga?
    *   ¿Los productos recientes aparecen?
    *   ¿Las imágenes se ven correctamente?
