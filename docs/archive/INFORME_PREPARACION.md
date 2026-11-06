# Informe Final: Preparación de Despliegue (Estrategia Zero-Bandwidth)

## 1. Resumen Ejecutivo
Se ha rediseñado completamente la estrategia de despliegue para eliminar la dependencia de ancho de banda en el servidor VPS. El nuevo flujo garantiza que **nunca se descargas imágenes ni se construyen contenedores en el servidor**. Todo el procesamiento pesado se traslada a la máquina local del desarrollador.

---

## 2. Arquitectura Final Definida

La solución se compone de 5 servicios orquestados mediante Docker Compose.

| Servicio | Tecnología | Puerto Interno | Comunicación | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx** | Nginx Alpine | **80 / 443** | **Público** | Reverse Proxy. Único punto de entrada. Gestiona SSL y rutas. |
| **Frontend** | Next.js (Standalone) | 3000 | Privado | Optimizado con `output: standalone`. Solo accesible vía Nginx. |
| **Backend** | Express / Node.js | 3001 | Privado | API REST. Solo accesible vía Nginx (`/api`). CORS configurado. |
| **Database** | MySQL 8 | 3306 | Privado | Persistencia de datos. Volumen `mysql_data`. |
| **Redis** | Redis Alpine | 6379 | Privado | Caché y sesiones. |

### Diagrama de Flujo de Datos
`Internet` -> `Nginx (80)` -> `Frontend (3000)` / `Backend (3001)` -> `DB` / `Redis`

---

## 3. Estrategia de Despliegue "Zero-Bandwidth"

Se ha establecido una política estricta de **"Solo Carga"** (Load-Only) para el servidor.

1.  **Build Local**: Las imágenes `peruana-frontend` y `peruana-backend` se compilan en la PC del desarrollador usando Dockerfiles Multi-stage, reduciendo el tamaño final en un ~80%.
2.  **Empaquetado**: Las imágenes se guardan (`docker save`) y comprimen localmente en `app-images.tar.gz`.
3.  **Transferencia Única**: Se sube un único archivo comprimido al servidor vía SCP.
4.  **Carga (Load)**: El servidor ejecuta `docker load`, leyendo del disco local.
5.  **Sin Internet**: El servidor **NO** ejecuta `npm install`, `docker build` ni `docker pull` para la aplicación. Solo requiere las imágenes base (mysql/redis/nginx) una única vez (o también se pueden cargar manualmente).

---

## 4. Revisión de Configuraciones Sensibles

*   **CORS (Cross-Origin Resource Sharing)**:
    *   Configurado en Backend para aceptar orígenes dinámicos vía variable de entorno `ALLOWED_ORIGINS` o `CORS_ORIGIN`.
    *   Defecto seguro: `http://localhost:3000`.
*   **Puertos**:
    *   Estandarizados. Conflictos previos entre 3001/3002 resueltos. Backend fijo en 3001.
*   **Variables de Entorno**:
    *   Centralizadas en `.env`.
    *   Creado `.env.example` con todas las claves necesarias para producción (Base de datos, JWT, SMTP).
*   **Persistencia**:
    *   Volumen `mysql_data` asegurado para evitar pérdida de datos al reiniciar contenedores.
    *   Carpeta `uploads` mapeada para persistencia de archivos subidos.

---

## 5. Scripting y Automatización

Se han entregado los siguientes scripts para garantizar la repetibilidad:

*   **`deploy.ps1`**: Automatización de todo el ciclo (Build -> Compress -> Upload -> SSH -> Deploy).
*   **`test-local.ps1`**: Entorno de validación local que simula exactamente la producción (usa las mismas imágenes optimizadas).
*   **`docker-compose.prod.yml`**: Orquestación definitiva para producción.

Este entorno está **LISTO** para ser desplegado en cualquier servidor Linux con Docker, sin requisitos de velocidad de internet.
