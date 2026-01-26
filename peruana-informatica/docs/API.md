# 📊 API Reference

## Descripción

Documentación completa de todos los endpoints de la API REST del sistema.

**Base URL:** `http://localhost:3001/api`

---

## 🔓 Endpoints Públicos

### Health Check

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

---

## 📦 Productos

### Listar productos

```http
GET /api/products
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| page | number | 1 | Página actual |
| limit | number | 12 | Items por página |
| search | string | - | Búsqueda por nombre |
| category | number | - | ID de categoría |
| brand | number | - | ID de marca |
| min_price | number | - | Precio mínimo |
| max_price | number | - | Precio máximo |
| sort | string | newest | price_asc, price_desc, name, newest |
| featured | boolean | - | Solo destacados |

### Obtener producto

```http
GET /api/products/:id
GET /api/products/slug/:slug
```

### Productos relacionados

```http
GET /api/products/:id/related
```

---

## 📂 Categorías

### Listar categorías

```http
GET /api/categories
```

### Categorías para menú

```http
GET /api/categories/menu
```

### Obtener categoría

```http
GET /api/categories/:id
GET /api/categories/slug/:slug
```

---

## 🏷️ Marcas

### Listar marcas

```http
GET /api/brands
```

### Obtener marca

```http
GET /api/brands/:id
GET /api/brands/slug/:slug
```

---

## 📝 Blog

### Listar posts

```http
GET /api/blog
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página |
| limit | number | Items por página |
| category | string | Filtrar por categoría |
| tag | string | Filtrar por tag |

### Obtener post

```http
GET /api/blog/:id
GET /api/blog/slug/:slug
```

---

## 🛒 Pedidos (Cliente)

### Crear pedido

```http
POST /api/orders
```

**Body:**
```json
{
  "customer_name": "Juan Pérez",
  "customer_email": "juan@email.com",
  "customer_phone": "999888777",
  "customer_document": "12345678",
  "shipping_address": "Av. Principal 123",
  "shipping_district": "Miraflores",
  "shipping_city": "Lima",
  "payment_method": "transferencia",
  "invoice_type": "boleta",
  "notes": "Entregar en horario de oficina",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 5, "quantity": 1 }
  ]
}
```

### Subir comprobante

```http
POST /api/orders/:id/payment-proof
Content-Type: multipart/form-data
```

### Consultar pedido

```http
GET /api/client/orders/:id
```

### Descargar factura

```http
GET /api/client/orders/:id/invoice
```

---

## 🔐 Autenticación

### Login

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Refresh token

```http
POST /api/auth/refresh
```

### Perfil actual

```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

## 👨‍💼 Admin - Productos

> Todas las rutas admin requieren `Authorization: Bearer {token}`

### Listar productos

```http
GET /api/admin/products
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| search | string | Búsqueda |
| code | string | Código interno |
| category | number | ID categoría |
| brand | number | ID marca |
| stockFilter | string | all, available, low, out |
| sortBy | string | Campo para ordenar |
| sortOrder | string | ASC, DESC |

### Crear producto

```http
POST /api/admin/products
```

### Actualizar producto

```http
PUT /api/admin/products/:id
```

### Eliminar producto

```http
DELETE /api/admin/products/:id
```

### Sincronizar con ERP

```http
POST /api/admin/products/:id/sync
POST /api/admin/products/sync-all
```

### Subir imágenes

```http
POST /api/admin/products/:id/images
Content-Type: multipart/form-data
```

---

## 👨‍💼 Admin - Categorías

### CRUD Categorías

```http
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

---

## 👨‍💼 Admin - Marcas

### CRUD Marcas

```http
GET    /api/admin/brands
POST   /api/admin/brands
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id
```

---

## 👨‍💼 Admin - Pedidos

### Listar pedidos

```http
GET /api/admin/orders
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| status | string | Estado del pedido |
| payment_status | string | Estado del pago |
| from_date | date | Fecha desde |
| to_date | date | Fecha hasta |

### Obtener pedido

```http
GET /api/admin/orders/:id
```

### Actualizar estado

```http
PATCH /api/admin/orders/:id/status
```

**Body:**
```json
{
  "status": "processing"
}
```

---

## 👨‍💼 Admin - Pagos

### Verificar pago

```http
PATCH /api/admin/payments/:id/verify
```

**Body:**
```json
{
  "verified": true,
  "verified_by": "Admin"
}
```

### Generar factura

```http
POST /api/admin/payments/:id/generate-invoice
```

**Body:**
```json
{
  "invoice_number": "B001-00000001"
}
```

---

## 👨‍💼 Admin - Blog

### CRUD Posts

```http
GET    /api/admin/blog
POST   /api/admin/blog
PUT    /api/admin/blog/:id
DELETE /api/admin/blog/:id
```

### IA - Generar títulos

```http
POST /api/admin/blog/ai/generate-titles
```

**Body:**
```json
{
  "topic": "laptops gaming"
}
```

### IA - Generar contenido

```http
POST /api/admin/blog/ai/generate-content
```

**Body:**
```json
{
  "title": "Las Mejores Laptops Gaming",
  "topic": "laptops"
}
```

---

## 👨‍💼 Admin - Dashboard

### Estadísticas

```http
GET /api/admin/dashboard
```

**Respuesta:**
```json
{
  "stats": {
    "totalProducts": 150,
    "totalOrders": 45,
    "totalRevenue": 125000.00,
    "pendingOrders": 5
  },
  "recentOrders": [...],
  "topProducts": [...],
  "salesByMonth": [...]
}
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request - Datos inválidos |
| 401 | No autorizado - Token inválido |
| 403 | Prohibido - Sin permisos |
| 404 | No encontrado |
| 429 | Too Many Requests - Rate limit |
| 500 | Error interno del servidor |

### Formato de error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    { "field": "email", "message": "Email inválido" }
  ]
}
```

---

## 📊 Rate Limiting

| Endpoint | Límite |
|----------|--------|
| General | 1000 req/15min |
| Login | 5 req/15min |
| Búsqueda | 500 req/15min |

---

## 🔧 Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer {token}  # Solo rutas protegidas
```
