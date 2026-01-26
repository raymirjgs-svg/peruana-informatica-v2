# Sistema de Sincronización con API Externa

Este sistema permite sincronizar precios y stock de productos con la API externa del ERP de Peruana Informática en tiempo real.

## 📋 Características

- **Gestión Automática de Tokens**: Solicita y renueva tokens automáticamente
- **Sincronización Individual**: Actualiza un producto específico
- **Sincronización Masiva**: Actualiza múltiples productos o todos los productos
- **Actualización de Stock y Precios**: Mantiene sincronizados los datos con el sistema de ventas del cliente

## 🔑 Configuración del Token

### Solicitar un Nuevo Token

**Endpoint**: `POST /api/sync/token`

**Body**:
```json
{
  "usuario": "Raymir",
  "dias": 30
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Token obtenido y actualizado exitosamente",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2026-02-14T16:26:04.000Z"
}
```

### Verificar Estado del Token

**Endpoint**: `GET /api/sync/verify-token`

**Respuesta**:
```json
{
  "success": true,
  "tokenValido": true,
  "message": "Token válido"
}
```

## 📦 Sincronización de Productos

### 1. Sincronizar un Producto Individual

**Endpoint**: `POST /api/sync/product/:id`

**Ejemplo**: `POST /api/sync/product/19287`

**Respuesta**:
```json
{
  "success": true,
  "message": "Producto sincronizado exitosamente",
  "data": {
    "id": 123,
    "externalId": "19287",
    "nombre": "Procesador Intel Core i7",
    "stock": 15,
    "precio": 1299.99,
    "precioOferta": 1199.99,
    "disponible": true
  }
}
```

### 2. Sincronizar Múltiples Productos

**Endpoint**: `POST /api/sync/products`

**Body**:
```json
{
  "ids": ["19287", "19288", "19289"]
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Sincronización completada: 3 productos actualizados",
  "data": {
    "total": 3,
    "actualizados": 3,
    "errores": 0,
    "detalles": {
      "actualizados": [
        {
          "id": 123,
          "externalId": "19287",
          "nombre": "Procesador Intel Core i7",
          "actualizado": true
        }
      ],
      "errores": []
    }
  }
}
```

### 3. Sincronizar Todos los Productos

**Endpoint**: `POST /api/sync/all-products`

**Respuesta**:
```json
{
  "success": true,
  "message": "Sincronización masiva completada: 150/150 productos actualizados",
  "data": {
    "total": 150,
    "actualizados": 150,
    "errores": 0,
    "detalles": {
      "actualizados": [...],
      "errores": []
    }
  }
}
```

## 🔄 Uso Programático

### Desde el Backend (TypeScript/Node.js)

```typescript
import { PeruanaInformaticaService } from './services/PeruanaInformaticaService';

// Solicitar un nuevo token
const tokenResult = await PeruanaInformaticaService.solicitarToken('Raymir', 30);
console.log('Token:', tokenResult.token);

// Verificar y renovar token automáticamente (se ejecuta antes de cada consulta)
await PeruanaInformaticaService.verificarYRenovarToken();

// Consultar un producto
const producto = await PeruanaInformaticaService.obtenerStockYPrecio('19287');
console.log('Stock:', producto.stock, 'Precio:', producto.precio);

// Sincronizar múltiples productos
const ids = ['19287', '19288', '19289'];
const resultados = await PeruanaInformaticaService.sincronizarProductos(ids);
```

### Desde el Frontend (React/Next.js)

```typescript
// Crear un servicio de sincronización
export const syncAPI = {
  // Solicitar token
  solicitarToken: async (usuario: string = 'Raymir', dias: number = 30) => {
    const response = await fetch(`${API_URL}/api/sync/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, dias })
    });
    return response.json();
  },

  // Sincronizar un producto
  sincronizarProducto: async (id: string) => {
    const response = await fetch(`${API_URL}/api/sync/product/${id}`, {
      method: 'POST'
    });
    return response.json();
  },

  // Sincronizar múltiples productos
  sincronizarProductos: async (ids: string[]) => {
    const response = await fetch(`${API_URL}/api/sync/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    return response.json();
  },

  // Sincronizar todos los productos
  sincronizarTodos: async () => {
    const response = await fetch(`${API_URL}/api/sync/all-products`, {
      method: 'POST'
    });
    return response.json();
  }
};

// Uso en un componente
const actualizarProducto = async (codigoInterno: string) => {
  const result = await syncAPI.sincronizarProducto(codigoInterno);
  if (result.success) {
    console.log('Producto actualizado:', result.data);
  }
};
```

## ⏰ Sincronización Automática Programada

Para mantener los precios y stock actualizados automáticamente, puedes crear un cron job:

### Usando node-cron

```typescript
import cron from 'node-cron';
import { PeruanaInformaticaService } from './services/PeruanaInformaticaService';
import Product from './models/Product';

// Sincronizar todos los productos cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Iniciando sincronización automática...');
  
  const { Op } = require('sequelize');
  const productos = await Product.findAll({
    where: {
      codigo_interno: { [Op.ne]: null, [Op.ne]: '' }
    },
    attributes: ['codigo_interno']
  });

  const ids = productos.map(p => p.codigo_interno).filter(Boolean);
  const resultados = await PeruanaInformaticaService.sincronizarProductos(ids);
  
  console.log('✅ Sincronización completada:', resultados.length, 'productos');
});
```

## 🛡️ Seguridad

**IMPORTANTE**: En producción, debes proteger estos endpoints con autenticación:

```typescript
import { authMiddleware } from './middleware/auth';

router.post('/token', authMiddleware, SyncController.solicitarToken);
router.post('/all-products', authMiddleware, SyncController.sincronizarTodosLosProductos);
```

## 📝 Notas Importantes

1. **Campo `codigo_interno`**: Los productos deben tener el campo `codigo_interno` configurado con el ID de la API externa
2. **Renovación Automática**: El token se renueva automáticamente 7 días antes de expirar
3. **Rate Limiting**: Hay una pausa de 500ms entre cada consulta para no saturar la API
4. **Campos Actualizados**:
   - `stock`: Stock disponible
   - `price`: Precio principal (pre_cli)
   - `price_web`: Precio de oferta (pre_web)

## 🚀 Ejemplo de Flujo Completo

```typescript
// 1. Obtener nuevo token (hacer una vez al mes)
const token = await fetch('http://localhost:3001/api/sync/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: 'Raymir', dias: 30 })
});

// 2. Sincronizar todos los productos
const sync = await fetch('http://localhost:3001/api/sync/all-products', {
  method: 'POST'
});

console.log(await sync.json());
```

## 🐛 Depuración

Para ver los logs de sincronización, revisa la consola del servidor backend. Verás mensajes como:

```
✓ Nuevo token obtenido exitosamente. Expira: 2026-02-14T16:26:04.000Z
✓ Token actualizado en .env
Iniciando sincronización de 3 productos...
✓ Producto 19287 sincronizado: Stock=15, Precio=1299.99
✓ Producto 19288 sincronizado: Stock=8, Precio=899.99
✓ Producto 19289 sincronizado: Stock=23, Precio=599.99
✓ Sincronización completada: 3/3 exitosos
```
