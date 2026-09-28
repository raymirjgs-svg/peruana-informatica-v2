# Documentación Técnica del Servidor — Infraestructura de Producción

Documentación Técnica · Infraestructura

# Servidor de Producción

Guía completa de arquitectura, configuración y mantenimiento

Versión1.0

FechaMarzo 2026

Servidor168.181.186.63

Proyectos3 sitios web

## Contenido

1
Información del Servidor

2
Arquitectura General

3
Proyectos Desplegados

4
Contenedores Docker

5
Estructura de Archivos

6
Acceso SSH

7
Actualizar / Redesplegar

8
Bases de Datos

9
Variables de Entorno

10
Configuración Nginx

11
Activar HTTPS / SSL

12
Comandos de Mantenimiento

1

Información del Servidor

Especificaciones técnicas y acceso al VPS

IP del Servidor
168.181.186.63

Puerto SSH
5884

Sistema Operativo
Ubuntu 24.04 LTS

Usuario SSH
root

Motor de contenedores
Docker 29.2.1

Servidor Web (host)
nginx 1.24.0

Certificados SSL
certbot 2.9.0 (Let's Encrypt)

Estado
Operativo

    ℹ️

El servidor tiene **nginx instalado directamente en el host** (no dentro de Docker). Nginx recibe todo el tráfico del puerto 80/443 y lo redirige a los contenedores según el dominio.

2

Arquitectura General

Flujo del tráfico desde internet hasta los contenedores

INTERNET
    │
    ▼  puerto 80 / 443
┌─────────────────────────────────────────────────────────┐
│  NGINX (host)  —  168.181.186.63                        │
│  /etc/nginx/sites-enabled/                              │
│                                                         │
│  peruanadeinformatica.com.pe  ──► 127.0.0.1:3000 (frontend)│
│                               ──► 127.0.0.1:3001 (backend) │
│  katsher.com                  ──► 127.0.0.1:3005           │
│  magnatte.es                  ──► 127.0.0.1:3007           │
└───────────────┬─────────────────────────────────────────┘
                │  solo localhost (no expuesto a internet)
    ┌───────────▼──────────────────────────────────────────┐
    │  DOCKER CONTAINERS                                    │
    │                                                      │
    │  peruana_frontend  :3000  Next.js 15               │
    │  peruana_backend   :3001  Express.js + TypeScript   │
    │  peruana_mysql     :3306  MySQL 8 (solo red interna) │
    │  peruana_redis     :6379  Redis (solo red interna)   │
    │                                                      │
    │  katsher_app       :3005  Next.js                    │
    │  katsher_db        :3306  MySQL 8 (solo red interna) │
    │                                                      │
    │  magnatte_app      :3007  Next.js                    │
    │  magnatte_db       :3306  MySQL 8 (solo red interna) │
    └──────────────────────────────────────────────────────┘

Los puertos de los contenedores están ligados a `127.0.0.1` (solo localhost), por lo que **no son accesibles directamente desde internet**. Todo el tráfico externo pasa obligatoriamente por nginx.

3

Proyectos Desplegados

Los 3 sitios web alojados en el servidor

  

🛒

Peruana de Informática

peruanadeinformatica.com.pe

      Activo

Directorio en servidor
/root/projects/peruana-informatica-v2/

Docker Compose
docker-compose.prod.yml

Frontend (Next.js)
127.0.0.1:3000

Backend (Express API)
127.0.0.1:3001

Base de datos
MySQL 8 — peruana_informatica

Caché
Redis 7

Imágenes de productos
/var/www/images/

Productos en BD
1,191 productos

  

🏪

Katsher

katsher.com

      Activo

Directorio en servidor
/root/projects/katsher_v2/

Docker Compose
docker-compose.newserver.yml

Aplicación
127.0.0.1:3005

Base de datos
MySQL 8 — katsher_db

Imágenes
/var/www/katsher/

Rama Git
main / develop

  

✨

Magnatte

magnatte.es

      Activo

Directorio en servidor
/root/projects/magnatte/

Docker Compose
docker-compose.newserver.yml

Aplicación
127.0.0.1:3007

Base de datos
MySQL 8 — magnatte_db

Imágenes
/var/www/magnatte_images/

Credenciales admin
admin@magnatte.es

4

Contenedores Docker

Lista completa de todos los contenedores en ejecución

    

| 
        Contenedor |
        Imagen / Tecnología |
        Puerto |
        Red Docker |
        Estado |
      
    
    

| 
        `peruana_frontend` |
        Next.js 15 (node:20-alpine) |
        `127.0.0.1:3000` |
        peruana_net |
        healthy |
      

| 
        `peruana_backend` |
        Express.js + TypeScript (node:20-alpine) |
        `127.0.0.1:3001` |
        peruana_net |
        healthy |
      

| 
        `peruana_mysql` |
        MySQL 8.0 |
        interno (peruana_net) |
        peruana_net |
        healthy |
      

| 
        `peruana_redis` |
        Redis 7 (Alpine) |
        interno (peruana_net) |
        peruana_net |
        healthy |
      

| 
        `katsher_app` |
        Next.js (node:18-alpine) |
        `127.0.0.1:3005` |
        katsher_net |
        healthy |
      

| 
        `katsher_db` |
        MySQL 8.0 |
        interno (katsher_net) |
        katsher_net |
        healthy |
      

| 
        `magnatte_app` |
        Next.js (node:20-alpine) |
        `127.0.0.1:3007` |
        magnatte_net |
        healthy |
      

| 
        `magnatte_db` |
        MySQL 8.0 |
        interno (magnatte_net) |
        magnatte_net |
        healthy |
      
    

    ℹ️

Todos los contenedores tienen la política **restart: unless-stopped**, lo que significa que se reinician automáticamente si el servidor se reinicia o si el contenedor falla.

5

Estructura de Archivos en el Servidor

Ubicación de todos los archivos importantes

/root/
├── projects/                          ← Código fuente de los proyectos
│   ├── peruana-informatica-v2/         ← Repo Git (branch: develop)
│   │   ├── docker-compose.prod.yml
│   │   ├── envs/
│   │   │   └── .env.production          ← Variables de entorno
│   │   └── peruana-informatica/
│   │       ├── frontend/                ← Código Next.js
│   │       └── backend/                 ← Código Express.js
│   │
│   ├── katsher_v2/                     ← Repo Git Katsher
│   │   ├── docker-compose.newserver.yml
│   │   └── .env                         ← Variables de entorno
│   │
│   └── magnatte/                       ← Repo Git Magnatte
│       ├── docker-compose.newserver.yml
│       └── .env                         ← Variables de entorno
│
├── get_ssl.sh                          ← Script para activar HTTPS
│
/var/www/
├── images/                             ← Imágenes de Peruana de Informática
│   └── products/                        ← Fotos de productos
│
├── katsher/                            ← Imágenes de Katsher
│   ├── images/
│   ├── uploads/
│   └── banners/
│
└── magnatte_images/                    ← Imágenes de Magnatte
│
/etc/nginx/
├── sites-enabled/
│   ├── peruanadeinformatica.com.pe      ← Config HTTP activa
│   ├── katsher.com
│   └── magnatte.es
└── sites-ssl-ready/                     ← Configs HTTPS listas (activar con get_ssl.sh)
    ├── peruanadeinformatica.com.pe
    ├── katsher.com
    └── magnatte.es

6

Acceso SSH al Servidor

Cómo conectarse al servidor desde cualquier equipo

### Desde Linux / macOS / Windows (PowerShell o CMD)

    bash

# Conectarse al servidor
ssh root@168.181.186.63 -p 5884

# El sistema pedirá la contraseña del servidor

### Desde Windows con PuTTY

| Campo |Valor |

| Host Name (or IP) |`168.181.186.63` |

| Port |`5884` |

| Connection type |SSH |

| Username (al conectar) |`root` |

    ⚠️

**Importante:** Guarda las credenciales en un lugar seguro. El acceso como `root` tiene control total del servidor. No compartas la contraseña.

7

Actualizar / Redesplegar un Proyecto

Pasos para aplicar cambios de código al servidor

### Peruana de Informática

    bash

# 1. Ir al directorio del proyecto
cd /root/projects/peruana-informatica-v2

# 2. Descargar últimos cambios del repositorio Git
git pull origin develop

# 3. Reconstruir las imágenes Docker con el nuevo código
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend

# 4. Reiniciar los contenedores con las nuevas imágenes
docker compose -f docker-compose.prod.yml up -d --no-build

### Katsher

    bash

cd /root/projects/katsher_v2
git pull
docker compose -f docker-compose.newserver.yml build app
docker compose -f docker-compose.newserver.yml up -d --no-build

### Magnatte

    bash

cd /root/projects/magnatte
git pull
docker compose -f docker-compose.newserver.yml build app
docker compose -f docker-compose.newserver.yml up -d --no-build

    ℹ️

El paso `build` puede tardar **3 a 10 minutos** dependiendo del proyecto (Next.js necesita compilar). Durante ese tiempo el sitio sigue funcionando con la versión anterior. El downtime solo ocurre en el paso `up -d` (segundos).

8

Bases de Datos

Gestión de MySQL para cada proyecto

    

| Proyecto |Contenedor MySQL |Base de Datos |Datos |
    
    

| 
        Peruana de Informática |
        `peruana_mysql` |
        `peruana_informatica` |
        1,191 productos, 35 categorías, 396 marcas |
      

| 
        Katsher |
        `katsher_db` |
        `katsher` |
        Productos, usuarios, pedidos |
      

| 
        Magnatte |
        `magnatte_db` |
        `magnatte_v2` |
        Productos, usuarios, pedidos |
      
    

### Acceder a MySQL desde el servidor (Peruana)

    bash

# Entrar al contenedor MySQL
docker exec -it peruana_mysql bash

# Dentro del contenedor, conectarse a MySQL
mysql -uroot -p peruana_informatica

# Comandos útiles dentro de MySQL
SHOW TABLES;
SELECT COUNT(*) FROM products;
EXIT;

### Hacer un backup de la base de datos

    bash

# Backup Peruana (guarda en /root/backup_peruana.sql)
docker exec peruana_mysql sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" peruana_informatica' \
  > /root/backup_peruana_$(date +%Y%m%d).sql

# Backup Katsher
docker exec katsher_db sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" katsher' \
  > /root/backup_katsher_$(date +%Y%m%d).sql

    ⚠️

Los datos de la base de datos se guardan en **volúmenes Docker persistentes**. Se conservan aunque el contenedor se elimine. Sin embargo, si se elimina el volumen (`docker volume rm`), los datos se pierden. Haz backups periódicos.

9

Variables de Entorno

Configuración sensible de cada proyecto

    🔒

**Importante:** Los archivos `.env` contienen contraseñas, claves API y secretos. Nunca los subas a Git ni los compartas. Solo deben existir en el servidor.

### Peruana de Informática

Archivo: `/root/projects/peruana-informatica-v2/envs/.env.production`

| Variable |Descripción |Acción requerida |
    

| `DB_PASSWORD` |Contraseña MySQL |Ya configurada |

| `JWT_SECRET` |Secreto para tokens de sesión |Ya configurada |

| `NEXTAUTH_SECRET` |Secreto para NextAuth |Ya configurada |

| `EMAIL_USER / EMAIL_PASS` |Cuenta para envío de emails |Configurar con SMTP propio |

| `MP_ACCESS_TOKEN` |Token de MercadoPago |Reemplazar con token real |

| `CULQI_SECRET_KEY` |Clave secreta de Culqi |Agregar al activar Culqi |

| `NEXT_PUBLIC_CULQI_PUBLIC_KEY` |Clave pública de Culqi |Agregar al activar Culqi |

| `GEMINI_API_KEY` |API de Google para IA |Ya configurada |
    

### Cómo editar las variables de entorno

    bash

# Editar con nano (editor de texto simple)
nano /root/projects/peruana-informatica-v2/envs/.env.production

# Guardar: Ctrl+O, Enter. Salir: Ctrl+X

# Después de editar, reiniciar el contenedor para que tome los cambios
cd /root/projects/peruana-informatica-v2
docker compose -f docker-compose.prod.yml up -d --no-build backend

    ℹ️

Las variables `NEXT_PUBLIC_*` del frontend se **compilan dentro de la imagen Docker**. Si las cambias, necesitas hacer `build frontend` y luego `up -d frontend`.

10

Configuración Nginx

Reglas de routing por dominio y rutas

#### peruanadeinformatica.com.pe

- /api/auth/ → frontend :3000 (NextAuth)

- /api/ → backend :3001

- /images/ → /var/www/images/ (estáticos)

- /uploads/ → /var/www/images/products/

- / → frontend :3000

#### katsher.com

- /api/ → app :3005 (API interna Next.js)

- /images/ → /var/www/katsher/images/

- /uploads/ → /var/www/katsher/uploads/

- /banners/ → /var/www/katsher/banners/

- / → app :3005

#### magnatte.es

- /api/ → app :3007 (API interna Next.js)

- /assets/ → app :3007/magnatte/assets/

- / → app :3007

#### Comandos nginx útiles

- Verificar config: nginx -t

- Recargar: systemctl reload nginx

- Estado: systemctl status nginx

- Logs: tail -f /var/log/nginx/error.log

### Editar configuración nginx

    bash

# Editar config de Peruana
nano /etc/nginx/sites-enabled/peruanadeinformatica.com.pe

# Verificar que no hay errores de sintaxis
nginx -t

# Aplicar cambios
systemctl reload nginx

11

Activar HTTPS / SSL

Pasos para activar certificados SSL con Let's Encrypt

    ⚠️

**Requisito previo:** Los dominios deben apuntar a la IP del servidor (`168.181.186.63`) en el DNS antes de ejecutar este script. Sin DNS configurado, el script fallará.

### Verificar que el DNS apunta al servidor

    bash

# Verificar cada dominio (deben mostrar 168.181.186.63)
dig +short peruanadeinformatica.com.pe
dig +short katsher.com
dig +short magnatte.es

### Activar SSL (una sola vez)

    bash

# Script automatizado — verifica DNS, obtiene certificados y activa HTTPS
bash /root/get_ssl.sh

# El script hace automáticamente:
# 1. Solicita certificados a Let's Encrypt para los 3 dominios
# 2. Reemplaza configs HTTP por configs HTTPS en nginx
# 3. Recarga nginx
# 4. Activa renovación automática (cada 90 días)

### Renovación automática

Los certificados Let's Encrypt se renuevan automáticamente con `certbot renew` mediante un cron job. Para verificar:

    bash

# Ver cuándo vencen los certificados
certbot certificates

# Forzar renovación manual
certbot renew --force-renewal

12

Comandos de Mantenimiento

Referencia rápida para administrar el servidor

### Ver estado de todos los contenedores

    bash

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

### Ver logs de un contenedor

    bash

# Últimas 100 líneas del backend de Peruana
docker logs peruana_backend --tail 100

# Seguir logs en tiempo real (Ctrl+C para salir)
docker logs -f peruana_frontend

# Logs de Katsher
docker logs katsher_app --tail 50

### Reiniciar un contenedor específico

    bash

docker restart peruana_backend
docker restart peruana_frontend
docker restart katsher_app
docker restart magnatte_app

### Reiniciar todos los contenedores de un proyecto

    bash

cd /root/projects/peruana-informatica-v2
docker compose -f docker-compose.prod.yml restart

### Verificar uso de disco y memoria

    bash

# Uso de disco
df -h

# Uso de memoria y CPU por contenedor
docker stats --no-stream

# Espacio usado por imágenes y volúmenes Docker
docker system df

### Limpiar recursos Docker no utilizados

    bash

# Elimina imágenes, contenedores y redes sin usar (NO elimina volúmenes con datos)
docker system prune -f

# Solo eliminar imágenes antiguas (dangling)
docker image prune -f

### Salud del servidor

    bash

# Verificar que los sitios responden (debe dar 200)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3005
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3007

### Checklist de mantenimiento mensual

| Tarea |Frecuencia |Comando clave |
      

| Verificar que todos los contenedores están healthy |Semanal |`docker ps` |

| Revisar logs en busca de errores |Semanal |`docker logs [container]` |

| Backup de base de datos |Semanal |`mysqldump` |

| Verificar espacio en disco (debe quedar &gt; 20%) |Mensual |`df -h` |

| Limpiar imágenes Docker no usadas |Mensual |`docker system prune -f` |

| Verificar renovación de certificados SSL |Mensual |`certbot certificates` |

| Actualizar sistema operativo |Mensual |`apt update && apt upgrade` |
      

!

Tareas Pendientes

Acciones que el cliente debe completar para finalizar la configuración

1

      **Configurar DNS de los dominios**

En el panel de tu registrador de dominio (GoDaddy, Namecheap, etc.), crear registros tipo A apuntando a `168.181.186.63` para `peruanadeinformatica.com.pe`, `katsher.com` y `magnatte.es`.

2

      **Activar HTTPS**

Una vez el DNS propague (puede tomar hasta 24 h), ejecutar `bash /root/get_ssl.sh` desde el servidor para obtener los certificados SSL gratuitos.

3

      **Configurar email (SMTP)**

Editar `/root/projects/peruana-informatica-v2/envs/.env.production` y reemplazar `EMAIL_USER` y `EMAIL_PASS` con una cuenta real para el envío de notificaciones de pedidos.

4

      **Configurar pasarela de pago Culqi (opcional)**

Obtener las API keys en [dashboard.culqi.com](https://dashboard.culqi.com), agregar `CULQI_SECRET_KEY` y `NEXT_PUBLIC_CULQI_PUBLIC_KEY` al archivo de variables de entorno, y hacer rebuild del frontend.

5

      **Cambiar contraseña SSH del servidor**

Por seguridad, cambiar la contraseña root con el comando `passwd` luego de verificar que todo funciona. También se recomienda configurar acceso por clave SSH en lugar de contraseña.
