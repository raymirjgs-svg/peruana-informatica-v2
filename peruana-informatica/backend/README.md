# Backend - Peruana Informática

## Configuración inicial

### 1. Variables de entorno
Crea un archivo `.env` en la raíz del directorio `backend` con la siguiente configuración:

```env
# Configuración de Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=peruana_informatica
DATABASE_USER=root
DATABASE_PASSWORD=tu_contraseña_aqui

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Para scripts de importación (opcional)
SOURCE_DB_HOST=localhost
SOURCE_DB_USER=root
SOURCE_DB_PASSWORD=tu_contraseña_aqui
SOURCE_DB_NAME=tu_base_datos_origen
SOURCE_DB_PORT=3306
```

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Inicializar base de datos
```bash
npm run init-db
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Compilar para producción
```bash
npm run build
npm start
```

## Scripts disponibles

- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Ejecuta el servidor compilado
- `npm run init-db` - Inicializa la base de datos

## Estructura del proyecto

```
backend/
├── src/
│   ├── controllers/     # Controladores (vacío por ahora)
│   ├── database/        # Configuración de base de datos
│   ├── middleware/      # Middleware de seguridad y errores
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Rutas de la API
│   └── scripts/         # Scripts de utilidad
├── scripts/             # Scripts de importación
└── dist/                # Archivos compilados
```

## API Endpoints

### Productos
- `GET /api/products` - Lista todos los productos con filtros
- `GET /api/products/:id` - Obtiene un producto por ID
- `GET /api/products/slug/:slug` - Obtiene un producto por slug

### Marcas
- `GET /api/brands` - Lista todas las marcas
- `GET /api/brands/:slug` - Obtiene una marca por slug

### Categorías
- `GET /api/categories` - Lista todas las categorías
- `GET /api/categories/menu` - Categorías para el menú
- `GET /api/categories/:slug` - Obtiene una categoría por slug

### Dashboard (Admin)
- `GET /api/admin/dashboard` - Estadísticas del dashboard

## Scripts de importación

### Importar desde CSV
```bash
node scripts/importFromCSV.js
```

### Importar desde otra base de datos
```bash
node scripts/importProducts.js
```

## Problemas solucionados

✅ Archivo .env faltante - Creado archivo de ejemplo
✅ Directorio controllers vacío - Creado archivo básico
✅ Imports circulares en modelos - Corregidos
✅ Scripts con configuraciones hardcodeadas - Actualizados para usar variables de entorno
✅ Problemas en dashboardRoutes - Corregidos imports de Sequelize
