# 📦 Sistema de Productos

## Descripción

El sistema de productos maneja el catálogo completo de la tienda, incluyendo categorías, marcas, stock y sincronización con ERP.

---

## 🗂️ Modelos de Datos

### Product (Producto)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| name | STRING | Nombre del producto |
| slug | STRING | URL amigable |
| description | TEXT | Descripción larga |
| short_description | STRING | Descripción corta |
| price | DECIMAL | Precio de venta |
| compare_price | DECIMAL | Precio anterior (tachado) |
| cost_price | DECIMAL | Precio de costo |
| sku | STRING | Código SKU |
| internal_code | STRING | Código interno ERP |
| stock | INTEGER | Cantidad en stock |
| min_stock | INTEGER | Stock mínimo alerta |
| category_id | INTEGER | FK a categoría |
| brand_id | INTEGER | FK a marca |
| is_active | BOOLEAN | Producto activo |
| is_featured | BOOLEAN | Producto destacado |

### Category (Categoría)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| name | STRING | Nombre |
| slug | STRING | URL amigable |
| description | TEXT | Descripción |
| image | STRING | Imagen de categoría |
| parent_id | INTEGER | Categoría padre (jerárquica) |
| is_active | BOOLEAN | Activa |

### Brand (Marca)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| name | STRING | Nombre |
| slug | STRING | URL amigable |
| logo | STRING | Logo de marca |
| is_active | BOOLEAN | Activa |

---

## 🔌 API Endpoints

### Públicos (Tienda)

#### Listar productos
```http
GET /api/products
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Items por página (default: 12) |
| search | string | Búsqueda por nombre |
| category | number | Filtrar por categoría |
| brand | number | Filtrar por marca |
| min_price | number | Precio mínimo |
| max_price | number | Precio máximo |
| sort | string | Ordenar: price_asc, price_desc, name, newest |

**Respuesta:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "pages": 13
  }
}
```

#### Obtener producto por slug
```http
GET /api/products/slug/:slug
```

#### Obtener producto por ID
```http
GET /api/products/:id
```

### Administración

#### Listar productos (admin)
```http
GET /api/admin/products
```

**Query Parameters adicionales:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| code | string | Buscar por código interno |
| stockFilter | string | all, available, low, out |
| sortBy | string | Campo para ordenar |
| sortOrder | string | ASC o DESC |

#### Crear producto
```http
POST /api/admin/products
```

**Body:**
```json
{
  "name": "Laptop Gaming",
  "description": "Descripción...",
  "price": 3500.00,
  "category_id": 1,
  "brand_id": 2,
  "stock": 10
}
```

#### Actualizar producto
```http
PUT /api/admin/products/:id
```

#### Eliminar producto
```http
DELETE /api/admin/products/:id
```

#### Sincronizar con ERP
```http
POST /api/admin/products/:id/sync
```

#### Sincronizar todos
```http
POST /api/admin/products/sync-all
```

---

## 🔄 Sincronización con ERP

El sistema puede sincronizar productos con un ERP externo.

### Configuración

En `backend/.env`:
```env
ERP_API_URL=https://tu-erp.com/api
ERP_API_TOKEN=tu-token-aqui
```

### Flujo de sincronización

1. El admin hace clic en "Sincronizar" en un producto
2. Backend consulta el ERP por `internal_code`
3. Se actualizan: precio, stock, descripción
4. Se guarda fecha de última sincronización

### Código relevante

**Archivo:** `backend/src/services/ERPService.ts`

```typescript
class ERPService {
  async syncProduct(internalCode: string) {
    // Consulta al ERP
    const erpData = await this.fetchFromERP(internalCode);
    
    // Actualiza en base de datos local
    await Product.update({
      price: erpData.price,
      stock: erpData.stock,
      last_sync: new Date()
    }, { where: { internal_code: internalCode } });
  }
}
```

---

## 🖼️ Imágenes de Productos

### Estructura de imágenes

Las imágenes se guardan en `backend/public/images/products/`

### Modelo ProductImage

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| product_id | INTEGER | FK a producto |
| url | STRING | Ruta de imagen |
| alt_text | STRING | Texto alternativo |
| position | INTEGER | Orden de visualización |
| is_primary | BOOLEAN | Imagen principal |

### Subir imágenes

```http
POST /api/admin/products/:id/images
Content-Type: multipart/form-data

file: [archivo de imagen]
```

---

## 📊 Filtros de Stock

El panel admin permite filtrar por estado de stock:

| Filtro | Descripción |
|--------|-------------|
| `all` | Todos los productos |
| `available` | Stock > min_stock |
| `low` | Stock > 0 pero < min_stock |
| `out` | Stock = 0 |

---

## 💡 Mejores Prácticas

1. **Siempre usar slugs** para URLs amigables
2. **Mantener sincronizado** con ERP regularmente
3. **Configurar min_stock** para alertas de inventario
4. **Optimizar imágenes** antes de subir (max 500KB)
5. **Usar códigos internos** para trazabilidad con ERP

---

## 🐛 Solución de Problemas

### Producto no aparece en tienda
- Verificar `is_active = true`
- Verificar que tenga categoría asignada
- Verificar que tenga al menos una imagen

### Error al sincronizar con ERP
- Verificar `ERP_API_URL` y `ERP_API_TOKEN`
- Verificar que el `internal_code` exista en ERP
- Revisar logs del servidor

### Imágenes no cargan
- Verificar permisos de carpeta `public/images`
- Verificar que la ruta en BD sea correcta
- Verificar tamaño máximo configurado
