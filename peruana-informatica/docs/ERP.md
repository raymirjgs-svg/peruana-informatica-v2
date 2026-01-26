# 🔄 Sincronización con ERP

## Descripción

El sistema permite sincronizar productos con un ERP externo para mantener actualizados precios, stock y descripciones.

---

## ⚙️ Configuración

### Variables de entorno

En `backend/.env`:

```env
# URL base del API del ERP
ERP_API_URL=https://tu-erp.com/api

# Token de autenticación
ERP_API_TOKEN=tu-token-secreto

# Timeout en milisegundos (opcional)
ERP_TIMEOUT=30000
```

---

## 📁 Estructura del Código

### ERPService

**Archivo:** `backend/src/services/ERPService.ts`

```typescript
import axios from 'axios';

class ERPService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.ERP_API_URL;
    this.token = process.env.ERP_API_TOKEN;
  }

  async getProduct(internalCode: string): Promise<ERPProduct> {
    const response = await axios.get(
      `${this.baseUrl}/products/${internalCode}`,
      {
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );
    return response.data;
  }

  async syncProduct(product: Product): Promise<void> { ... }
  async syncAllProducts(): Promise<SyncResult> { ... }
}
```

---

## 🔌 Endpoints del ERP

El sistema espera que el ERP tenga estos endpoints:

### Obtener producto

```http
GET /api/products/:internal_code
Authorization: Bearer {token}
```

**Respuesta esperada:**
```json
{
  "code": "PROD-001",
  "name": "Laptop Gaming ASUS",
  "description": "Laptop gaming con RTX 4060...",
  "price": 3500.00,
  "cost": 2800.00,
  "stock": 15,
  "category": "Laptops",
  "brand": "ASUS",
  "images": [
    "https://erp.com/images/prod-001-1.jpg"
  ],
  "last_updated": "2025-12-23T10:00:00Z"
}
```

### Listar productos

```http
GET /api/products
Authorization: Bearer {token}
```

**Query Parameters:**
| Parámetro | Descripción |
|-----------|-------------|
| page | Página |
| limit | Items por página |
| updated_since | Fecha mínima de actualización |

---

## 🔄 Flujo de Sincronización

### Sincronización individual

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────►│   Backend   │────►│    ERP      │
│ Panel       │     │   API       │     │   API       │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                           │  GET /product      │
                           │◄───────────────────│
                           │                    │
                    ┌──────▼──────┐             │
                    │  Actualizar │             │
                    │  Base Datos │             │
                    └─────────────┘             │
```

### Sincronización masiva

1. Obtener todos los productos con `internal_code`
2. Consultar cada uno al ERP en lotes
3. Actualizar precios y stock
4. Registrar resultados

---

## 🔌 API del Sistema

### Sincronizar un producto

```http
POST /api/admin/products/:id/sync
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Producto sincronizado",
  "changes": {
    "price": { "old": 3000, "new": 3500 },
    "stock": { "old": 5, "new": 15 }
  }
}
```

### Sincronizar todos

```http
POST /api/admin/products/sync-all
```

**Respuesta:**
```json
{
  "success": true,
  "results": {
    "total": 150,
    "synced": 145,
    "errors": 5,
    "skipped": 0
  },
  "errors": [
    { "id": 23, "code": "PROD-023", "error": "No encontrado en ERP" }
  ]
}
```

---

## 📊 Campos Sincronizados

| Campo | Dirección | Descripción |
|-------|-----------|-------------|
| price | ERP → Local | Precio de venta |
| cost_price | ERP → Local | Precio de costo |
| stock | ERP → Local | Cantidad disponible |
| name | ERP → Local | Nombre (opcional) |
| description | ERP → Local | Descripción (opcional) |
| images | ERP → Local | URLs de imágenes |

### Campos que NO se sincronizan

- `slug` (generado localmente)
- `is_featured` (configuración local)
- `seo_*` (optimización local)

---

## ⏰ Sincronización Automática

### Cron Job (opcional)

Agregar en el servidor:

```bash
# Sincronizar cada 6 horas
0 */6 * * * curl -X POST http://localhost:3001/api/admin/products/sync-all
```

### Node-cron

```typescript
import cron from 'node-cron';

// Cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Iniciando sincronización automática...');
  await erpService.syncAllProducts();
});
```

---

## 🗂️ Registro de Sincronizaciones

### Modelo SyncLog

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| product_id | INTEGER | Producto sincronizado |
| sync_type | STRING | manual, automatic |
| status | STRING | success, error |
| changes | JSON | Cambios realizados |
| error_message | TEXT | Error si falló |
| synced_at | DATETIME | Fecha/hora |

---

## 🐛 Solución de Problemas

### Error: Connection refused
- Verificar `ERP_API_URL`
- Verificar que el ERP esté accesible
- Verificar firewall

### Error: 401 Unauthorized
- Verificar `ERP_API_TOKEN`
- Token puede haber expirado
- Generar nuevo token en ERP

### Error: Product not found
- Verificar `internal_code` en el producto
- Verificar que exista en el ERP
- Puede ser un producto nuevo no registrado

### Precios no se actualizan
- Verificar formato de respuesta del ERP
- Verificar que los campos coincidan
- Revisar logs de sincronización

---

## 💡 Mejores Prácticas

1. **Sincronizar en horarios de baja demanda**
2. **Monitorear errores** de sincronización
3. **Mantener backup** antes de sincronizaciones masivas
4. **Validar datos** del ERP antes de guardar
5. **Usar timeout** para evitar bloqueos
6. **Implementar reintentos** para errores temporales
