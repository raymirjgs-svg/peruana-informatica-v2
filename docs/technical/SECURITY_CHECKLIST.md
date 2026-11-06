# Checklist de Seguridad Operativa y Hardening

Este documento define las políticas de seguridad activa para el entorno de producción.

## 1. Protecciones Implementadas (Automáticas)

*   **Nginx Hardening**:
    *   `Server Tokens Off`: No revelamos versión de Nginx.
    *   `Security Headers`: HSTS, X-Frame-Options (anti-clickjacking), XSS Protection activados.
    *   `Rate Limiting`: Límite de 10 peticiones/segundo por IP hacia la API.
    *   `Timeouts`: Protección contra ataques lentos (Slowloris).

*   **Límites de Recursos (Docker)**:
    *   Contenedores restringidos en CPU y RAM para evitar que un proceso tumbe el servidor completo.

*   **Backup Seguro**:
    *   El contenedor de backups tiene acceso de **solo lectura** (`:ro`) a los archivos subidos, evitando borrados accidentales desde el script.

---

## 2. Checklist Mensual de Mantenimiento

- [ ] **Rotación de Logs**: Verificar que los logs de Docker no estén llenando el disco (`du -h /var/lib/docker/containers`).
- [ ] **Actualización de Imágenes**:
    Ejecutar una reconstrucción para traer parches de seguridad de Node.js y Alpine:
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ```
- [ ] **Revisión de SSL**: Verificar fecha de expiración de certificados (aunque Certbot es automático, conviene auditar).
- [ ] **Prueba de Restore**: Ejecutar una restauración en Staging para validar integridad de backups.

---

## 3. Reglas de Oro en Producción (Don't)

1.  ⛔ **NUNCA** editar código directamente en el contenedor o servidor. Todo cambio debe pasar por CI/CD o Git.
2.  ⛔ **NUNCA** desactivar el firewall `ufw` del servidor host (debe permitir solo 22, 80, 443).
3.  ⛔ **NUNCA** usar el usuario `root` para la base de datos en la aplicación (usar `peruana_user` como está configurado).
4.  ⛔ **NUNCA** exponer puerto 3306 (MySQL) a internet. Solo debe ser accesible vía red interna Docker (`peruana_net`).
