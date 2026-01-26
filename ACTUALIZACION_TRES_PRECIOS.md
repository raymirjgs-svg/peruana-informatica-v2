# 🔄 Sistema de Sincronización - ACTUALIZACIÓN

## ✅ Cambios Implementados

El sistema ahora captura **STOCK y TRES TIPOS DE PRECIOS** de la API externa:

### 📊 Campos que se Sincronizan

| Campo Local | Campo API Externa | Descripción |
|-------------|-------------------|-------------|
| `stock` | `stock` | Stock disponible del producto |
| `price` (pre_cli) | `pre_cli` | **Precio Cliente** - Precio principal |
| `price_cot` (pre_cot) | `pre_cot` | **Precio Cotización** - Precio para cotizaciones |
| `price_web` (pre_web) | `pre_web` | **Precio Web** - Precio publicado en web |
| `price_dis` (pre_dis) | `pre_dis` | **Precio Distribuidor** - Precio para distribuidores |

### 📦 Estructura de Datos Retornada

Cuando consultas un producto a través de la API, recibirás:

```json
{
  "success": true,
  "message": "Producto sincronizado exitosamente",
  "data": {
    "id": 123,
    "externalId": "19287",
    "nombre": "Procesador Intel Core i7",
    "stock": 15,
    "pre_cli": 1299.99,    // Precio Cliente
    "pre_cot": 1250.00,    // Precio Cotización  
    "pre_web": 1199.99,    // Precio Web
    "pre_dis": 1150.00,    // Precio Distribuidor
    "disponible": true
  }
}
```

### 🎯 Endpoints Actualizados

#### 1. Sincronizar Producto Individual
```powershell
POST /api/sync/product/19287
```

**Respuesta actualizada:**
```json
{
  "success": true,
  "data": {
    "stock": 15,
    "pre_cli": 1299.99,
    "pre_cot": 1250.00,
    "pre_web": 1199.99,
    "pre_dis": 1150.00,
    "disponible": true
  }
}
```

#### 2. Sincronizar Múltiples Productos
```powershell
POST /api/sync/products
Body: { "ids": ["19287", "19288", "19289"] }
```

#### 3. Sincronizar Todos los Productos
```powershell
POST /api/sync/all-products
```

### 🔧 Ejemplo de Uso

#### Desde PowerShell:

```powershell
# Sincronizar un producto y ver los tres precios
$response = Invoke-WebRequest -Uri 'http://localhost:3001/api/sync/product/19287' -Method POST | ConvertFrom-Json

Write-Host "Stock: $($response.data.stock)"
Write-Host "Precio Cliente: $($response.data.pre_cli)"
Write-Host "Precio Cotización: $($response.data.pre_cot)"
Write-Host "Precio Web: $($response.data.pre_web)"
Write-Host "Precio Distribuidor: $($response.data.pre_dis)"
```

#### Desde el Frontend (TypeScript/React):

```typescript
const syncProduct = async (codigoInterno: string) => {
  const response = await fetch(`/api/sync/product/${codigoInterno}`, {
    method: 'POST'
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Stock:', data.data.stock);
    console.log('Precio Cliente:', data.data.pre_cli);
    console.log('Precio Cotización:', data.data.pre_cot);
    console.log('Precio Web:', data.data.pre_web);
    console.log('Precio Distribuidor:', data.data.pre_dis);
  }
};
```

### 📝 Logs Mejorados

Ahora cuando sincronizas productos, verás logs más detallados:

```
✓ Producto 19287 sincronizado: Stock=15, Pre_CLI=1299.99, Pre_COT=1250.00, Pre_WEB=1199.99
✓ Producto 19288 sincronizado: Stock=8, Pre_CLI=899.99, Pre_COT=850.00, Pre_WEB=799.99
✓ Producto 19289 sincronizado: Stock=23, Pre_CLI=599.99, Pre_COT=550.00, Pre_WEB=499.99
```

### 🔄 Actualización de la Base de Datos

Cuando se sincroniza un producto, se actualizan estos campos en la tabla `products`:

```sql
UPDATE products SET
  stock = 15,              -- Stock disponible
  pre_cli = 1299.99,       -- Precio Cliente (campo 'price')
  pre_cot = 1250.00,       -- Precio Cotización (campo 'price_cot')
  pre_web = 1199.99,       -- Precio Web (campo 'price_web')
  pre_dis = 1150.00        -- Precio Distribuidor (campo 'price_dis')
WHERE codigo_interno = '19287';
```

### 💡 Consideraciones Importantes

1. **Precio Principal (`price`)**: Se mapea a `pre_cli` (Precio Cliente) como el precio base del producto

2. **Fallback de Precios**: Si algún precio no viene en la API, se guarda como 0:
   ```typescript
   pre_cli: parseFloat(articulo.pre_cli) || parseFloat(articulo.precio) || 0
   pre_cot: parseFloat(articulo.pre_cot) || 0
   pre_web: parseFloat(articulo.pre_web) || 0  
   pre_dis: parseFloat(articulo.pre_dis) || 0
   ```

3. **Stock y Disponibilidad**: 
   - `stock`: Cantidad numérica
   - `disponible`: `true` si `stock > 0`, o basado en el campo `disponible` de la API

### 🧪 Probar los Cambios

Ejecuta el script de prueba actualizado:

```powershell
cd backend
npx ts-node scripts/test-sync.ts
```

Verás la salida con los tres precios:

```
4️⃣ Obteniendo stock y precios...
✅ Stock y precios obtenidos
   Nombre: Procesador Intel Core i7
   Stock: 15
   Disponible: true
   ---
   📊 PRECIOS:
   Pre_CLI (Cliente): 1299.99
   Pre_COT (Cotización): 1250.00
   Pre_WEB (Web): 1199.99
   Pre_DIS (Distribuidor): 1150.00
```

### 📂 Archivos Modificados

1. ✅ `src/services/PeruanaInformaticaService.ts` - Función `obtenerStockYPrecio()`
2. ✅ `src/controllers/SyncController.ts` - Todos los métodos de sincronización
3. ✅ `scripts/test-sync.ts` - Script de pruebas actualizado

### 🎯 Próximos Pasos

1. **Probar con datos reales** del sistema de ventas del cliente
2. **Verificar que la API externa** devuelva efectivamente los tres precios
3. **Ajustar el frontend** para mostrar/usar los diferentes tipos de precios según el contexto:
   - Mostrar `pre_web` en la tienda online
   - Usar `pre_cot` en el módulo de cotizaciones
   - Aplicar `pre_dis` para distribuidores autorizados

---

**Actualizado**: 2026-01-15  
**Versión**: 2.0.0 - Soporte para múltiples tipos de precios
