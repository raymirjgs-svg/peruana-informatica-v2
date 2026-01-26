# 🛒 Flujo de Compras

## Descripción

El sistema de compras permite a los clientes agregar productos al carrito, realizar el checkout y completar pedidos con múltiples métodos de pago.

---

## 📊 Diagrama de Flujo

```
┌─────────────────┐
│  Cliente navega │
│    productos    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agregar al      │◄────────────────┐
│ carrito         │                 │
└────────┬────────┘                 │
         │                          │
         ▼                          │
┌─────────────────┐                 │
│ Ver carrito     │─── Continuar ───┘
│ /cart           │    comprando
└────────┬────────┘
         │ Proceder al pago
         ▼
┌─────────────────┐
│ Ingresar datos  │
│ del cliente     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Seleccionar     │
│ método de pago  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Confirmar       │────►│ Email: Cliente   │
│ pedido          │     │ Email: Admin     │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Subir           │
│ comprobante     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Admin verifica  │────►│ Email: Pago      │
│ pago            │     │ verificado       │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Admin genera    │────►│ Email: Factura   │
│ factura/boleta  │     │ adjunta          │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Pedido          │
│ completado      │
└─────────────────┘
```

---

## 🗂️ Modelos de Datos

### Order (Pedido)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| order_number | STRING | Número de pedido (ej: ORD-20251223-001) |
| customer_name | STRING | Nombre del cliente |
| customer_email | STRING | Email del cliente |
| customer_phone | STRING | Teléfono |
| customer_document | STRING | DNI/RUC |
| shipping_address | TEXT | Dirección de envío |
| shipping_district | STRING | Distrito |
| shipping_city | STRING | Ciudad |
| subtotal | DECIMAL | Subtotal sin IGV |
| igv | DECIMAL | IGV (18%) |
| shipping_cost | DECIMAL | Costo de envío |
| total_amount | DECIMAL | Total final |
| status | ENUM | pending, processing, shipped, delivered, cancelled |
| payment_method | STRING | transferencia, yape, plin, tarjeta |
| payment_status | ENUM | pending, uploaded, verified, rejected |
| payment_proof | STRING | Ruta del comprobante subido |
| invoice_type | STRING | boleta, factura |
| invoice_number | STRING | Número de comprobante |
| invoice_file | STRING | Ruta del PDF |
| notes | TEXT | Notas adicionales |

### OrderItem (Detalle del Pedido)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| order_id | INTEGER | FK al pedido |
| product_id | INTEGER | FK al producto |
| product_name | STRING | Nombre (snapshot) |
| product_sku | STRING | SKU (snapshot) |
| quantity | INTEGER | Cantidad |
| unit_price | DECIMAL | Precio unitario |
| total_price | DECIMAL | Subtotal línea |

---

## 🛒 Carrito de Compras

### Estado Global (Zustand)

El carrito usa Zustand para estado global y persistencia en localStorage.

**Archivo:** `frontend/src/store/cartStore.ts`

```typescript
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
```

### Uso en componentes

```tsx
import { useCartStore } from '@/store/cartStore';

function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem);
  
  return (
    <button onClick={() => addItem(product, 1)}>
      Agregar al carrito
    </button>
  );
}
```

---

## 💳 Métodos de Pago

### Transferencia Bancaria

```
Banco: BCP
Cuenta: 123-456789-0-12
CCI: 002-123-456789012345-67
Titular: Peruana Informática S.A.C.
RUC: 20123456789
```

### Yape

```
Número: 999 888 777
Titular: Peruana Informática
```

### Plin

```
Número: 999 888 777
Titular: Peruana Informática
```

### Tarjeta de Crédito/Débito
- Visa, Mastercard, American Express
- Procesado por pasarela de pagos

---

## 🔌 API Endpoints

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
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "order_number": "ORD-20251223-001",
    "total_amount": 2500.00
  },
  "message": "Pedido creado exitosamente"
}
```

### Subir comprobante de pago

```http
POST /api/orders/:id/payment-proof
Content-Type: multipart/form-data

file: [imagen del comprobante]
```

### Consultar pedido (cliente)

```http
GET /api/client/orders/:id
```

### Descargar factura/boleta

```http
GET /api/client/orders/:id/invoice
```

---

## 👨‍💼 Administración de Pedidos

### Listar pedidos

```http
GET /api/admin/orders
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| status | string | Filtrar por estado |
| payment_status | string | Filtrar por estado de pago |
| from_date | date | Fecha desde |
| to_date | date | Fecha hasta |

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

### Generar factura/boleta

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

## 📧 Emails Automáticos

### Al crear pedido

**Al cliente:**
- Confirmación del pedido
- Detalle de productos
- Instrucciones de pago
- Datos bancarios

**Al administrador:**
- Notificación de nuevo pedido
- Datos del cliente
- Link al panel admin

### Al verificar pago

**Al cliente:**
- Confirmación de pago recibido
- Próximos pasos

### Al generar factura

**Al cliente:**
- PDF adjunto de factura/boleta
- Link de descarga

---

## 📱 Página de Éxito

Después de confirmar el pedido, el cliente ve:

1. ✅ Confirmación del pedido
2. 📧 Aviso de email enviado
3. 📋 Número de pedido
4. 💰 Total a pagar
5. 📝 Instrucciones según método de pago
6. 🔗 Link para consultar estado

---

## 🐛 Solución de Problemas

### Pedido no se crea
- Verificar que hay productos en el carrito
- Verificar datos obligatorios del cliente
- Revisar logs del backend

### Email no llega
- Verificar configuración SMTP en `.env`
- Revisar carpeta de spam
- Verificar logs de EmailService

### Comprobante no se sube
- Verificar tamaño máximo (5MB)
- Verificar formato (jpg, png, pdf)
- Verificar permisos de carpeta uploads
