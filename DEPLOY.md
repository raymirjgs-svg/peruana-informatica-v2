# GUÍA DE DESPLIEGUE (Zero-Bandwidth Strategy)

Esta guía documenta el proceso de despliegue diseñado para **no consumir ancho de banda de descarga** en el servidor VPS. 
Todas las construcciones (builds) se realizan en local y solo se suben las imágenes comprimidas.

## 📋 Prerrequisitos

1.  **PC Local**:
    *   Docker Desktop instado y corriendo.
    *   PowerShell (Windows) o Terminal (Linux/Mac).
    *   Acceso SSH al servidor.

2.  **Servidor VPS**:
    *   Docker instalado.
    *   Puerto 80/443 habilitado.

---

## 🚀 Opción A: Despliegue Automático (Recomendado)

Se ha creado un script que automatiza todo el proceso.

1.  Abre PowerShell en la carpeta raíz del proyecto.
2.  Ejecuta:
    ```powershell
    .\deploy.ps1
    ```
    *Este script construye, comprime, sube y despliega automáticamente.*

---

## 🛠️ Opción B: Proceso Manual Paso a Paso

Si necesitas realizar el proceso manualmente o entender qué ocurre "bajo el capó", estos son los pasos detallados.

### 1. Construir Imágenes en Local

En lugar de que el servidor descargue Node.js y compile, lo hacemos aquí.

```bash
# Construir Backend
docker build -t peruana-backend:latest -f peruana-informatica/backend/Dockerfile.prod peruana-informatica/backend

# Construir Frontend (Standalone - Ultraligero)
docker build -t peruana-frontend:latest -f peruana-informatica/frontend/Dockerfile.prod peruana-informatica/frontend
```

### 2. Exportar y Comprimir Imágenes

Guardamos las imágenes "vivas" de Docker en un archivo portátil (`.tar`) y lo comprimimos para que pese lo menos posible.

```bash
# Guardar ambas imágenes en un solo archivo
docker save -o app-images.tar peruana-backend:latest peruana-frontend:latest

# Comprimir (reduce el tamaño aprox un 60-70%)
# En Windows (si tienes tar):
tar -czf app-images.tar.gz app-images.tar
# O usa 7-Zip si prefieres.
```

### 3. Subir al Servidor (SCP)

Enviamos el archivo comprimido y la configuración de producción.

```bash
# Subir imágenes
scp app-images.tar.gz root@149.50.144.210:/root/peruana-informatica/

# Subir docker-compose de producción (renombrándolo)
scp peruana-informatica/docker-compose.prod.yml root@149.50.144.210:/root/peruana-informatica/docker-compose.yml

# Subir configuración Nginx
scp -r peruana-informatica/nginx/conf.d/* root@149.50.144.210:/root/peruana-informatica/nginx/conf.d/
```

### 4. Desplegar en el Servidor

Conectamos por SSH y le decimos a Docker que "lea" el archivo que acabamos de subir. **Esto no consume internet del servidor**, ya que lee del disco duro.

```bash
ssh root@149.50.144.210

# Una vez dentro del servidor:
cd /root/peruana-informatica

# Descomprimir
tar -xzf app-images.tar.gz

# Cargar imágenes al motor de Docker
docker load -i app-images.tar

# Reiniciar contenedores (usará las imágenes que acabamos de cargar)
docker compose up -d

# Limpieza (opcional)
rm app-images.tar app-images.tar.gz
```

---

## 📂 Archivos Clave

*   `deploy.ps1`: Script de automatización Windows.
*   `peruana-informatica/frontend/Dockerfile.prod`: Configuación Multi-stage para frontend (Standalone).
*   `peruana-informatica/backend/Dockerfile.prod`: Configuración Multi-stage para backend.
*   `test-local.ps1`: Script para probar todo en tu PC antes de subir.
