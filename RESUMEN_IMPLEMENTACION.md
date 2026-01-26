# ✅ Sistema de Sincronización con API Externa - IMPLEMENTADO

## 📦 Lo que se implementó

### 1. **Servicio de Sincronización** (`PeruanaInformaticaService.ts`)

✅ **Funcionalidades agregadas:**
- `solicitarToken()` - Solicita un nuevo token con usuario y duración en días
- `updateEnvToken()` - Actualiza el token en el archivo .env automáticamente
- `verificarYRenovarToken()` - Verifica si el token está por expirar y lo renueva automáticamente
- `consultarArticulo()` - Consulta un artículo por ID (mejorado con renovación automática de token)
- `obtenerStockYPrecio()` - Obtiene stock y precio actualizado de un producto
- `sincronizarProductos()` - Sincroniza múltiples productos de una sola vez

### 2. **Controlador de Sincronización** (`SyncController.ts`)

✅ **Endpoints HTTP creados:**
- `POST /api/sync/token` - Solicita un nuevo token
- `GET /api/sync/verify-token` - Verifica el estado del token actual
- `POST /api/sync/product/:id` - Sincroniza un producto individual
- `POST /api/sync/products` - Sincroniza múltiples productos
- `POST /api/sync/all-products` - Sincroniza todos los productos con codigo_interno

### 3. **Rutas** (`syncRoutes.ts`)

✅ Rutas registradas en `/api/sync`

### 4. **Documentación**

✅ Documentación completa en `SINCRONIZACION_API.md`
✅ Script de prueba en `scripts/test-sync.ts`

---

## 🚀 Cómo usar

### **Paso 1: Solicitar un nuevo token**

Con el servidor corriendo (`npm run dev` en backend), abre una nueva terminal y ejecuta:

```powershell
# PowerShell
$body = @{
    usuario = "Raymir"
    dias = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/sync/token" -Method POST -ContentType "application/json" -Body $body
```

O simplemente:
```bash
curl -X POST http://localhost:3001/api/sync/token \
  -H "Content-Type: application/json" \
  -d "{\"usuario\":\"Raymir\",\"dias\":30}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Token obtenido y actualizado exitosamente",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2026-02-14T16:26:04.000Z"
}
```

### **Paso 2: Verificar el token**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/sync/verify-token" -Method GET
```

### **Paso 3: Sincronizar un producto**

```powershell
# Reemplaza "19287" con un codigo_interno válido de tu base de datos
Invoke-RestMethod -Uri "http://localhost:3001/api/sync/product/19287" -Method POST
```

### **Paso 4: Sincronizar múltiples productos**

```powershell
$body = @{
    ids = @("19287", "19288", "19289")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/sync/products" -Method POST -ContentType "application/json" -Body $body
```

### **Paso 5: Sincronizar TODOS los productos**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/sync/all-products" -Method POST
```

---

## 📊 Campos que se actualizan

Cuando sincronizas un producto desde la API externa, se actualizan estos campos en tu base de datos local:

| Campo Local | Campo API Externa | Descripción |
|-------------|-------------------|-------------|
| `stock` | `stock` | Stock disponible |
| `price` | `precio` | Precio principal (pre_cli) |
| `price_web` | `precioOferta` | Precio de oferta web |

---

## 🔄 Integración con el Sistema de Ventas del Cliente

La API del cliente funciona así:

**URL**: `http://54.144.139.115/peruanadeinformatica/api`

**Endpoints disponibles:**
1. `/solicitarToken` - POST - Solicita un nuevo token
   - Body: `{ "usuario": "Raymir", "dias": 30 }`

2. `/consultarArticulo` - POST - Consulta un artículo
   - Body: `{ "id": "19287", "token": "tu_token_aqui" }`

El sistema que implementamos automatiza toda esta comunicación:
- ✅ Solicita y renueva tokens automáticamente
- ✅ Actualiza el .env con el nuevo token
- ✅ Verifica antes de cada consulta si el token está por expirar
- ✅ Sincroniza precios y stock en tiempo real

---

## 🎯 Próximos Pasos Sugeridos

### **1. Crear tarea programada (Cron Job)**

Puedes instalar `node-cron` para sincronizar automáticamente:

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

Luego crear `src/jobs/syncJob.ts`:

```typescript
import cron from 'node-cron';
import { PeruanaInformaticaService } from '../services/PeruanaInformaticaService';
import Product from '../models/Product';

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Iniciando sincronización programada...');
  
  const productos = await Product.findAll({
    where: { codigo_interno: { [Op.ne]: null } },
    attributes: ['codigo_interno']
  });
  
  const ids = productos.map(p => p.codigo_interno).filter(Boolean);
  await PeruanaInformaticaService.sincronizarProductos(ids);
  
  console.log('✅ Sincronización completada');
});
```

### **2. Frontend - Botón de sincronización**

En tu panel de administración, puedes agregar un botón para sincronizar manualmente:

```typescript
// components/admin/SyncButton.tsx
const SyncButton = () => {
  const [loading, setLoading] = useState(false);
  
  const handleSync = async () => {
    setLoading(true);
    const response = await fetch('/api/sync/all-products', {
      method: 'POST'
    });
    const data = await response.json();
    alert(`Sincronizados: ${data.data.actualizados}/${data.data.total} productos`);
    setLoading(false);
  };
  
  return (
    <button onClick={handleSync} disabled={loading}>
      {loading ? 'Sincronizando...' : 'Sincronizar Productos'}
    </button>
  );
};
```

### **3. Logs y monitoreo**

Considera implementar un sistema de logs para rastrear las sincronizaciones:
- ¿Cuántos productos se sincronizaron?
- ¿Cuántos fallaron?
- ¿A qué hora se realizó la última sincronización?

---

## 🔐 Seguridad

**IMPORTANTE**: Antes de desplegar a producción:

1. Protege los endpoints con autenticación:
```typescript
import { authMiddleware } from './middleware/auth';

router.post('/token', authMiddleware, SyncController.solicitarToken);
router.post('/all-products', authMiddleware, SyncController.sincronizarTodosLosProductos);
```

2. Agrega rate limiting específico para estos endpoints

3. No expongas el token en respuestas del frontend

---

## 💡 Tips

- El token se renueva automáticamente 7 días antes de expirar
- Hay una pausa de 500ms entre cada consulta para no saturar la API
- Los logs en la consola del backend te dirán exactamente qué está pasando
- Si un producto no existe en tu BD local, solo te devolverá los datos sin actualizar nada

---

## ✅ Estado Actual

- ✅ Backend implementado y funcionando
- ✅ Endpoints probados y documentados
- ✅ Servidor corriendo en `http://localhost:3001`
- ✅ Token actual en `.env`: Configurado
- ⏳ Pendiente: Integración con frontend
- ⏳ Pendiente: Cron job para sincronización automática

---

## 📞 Contacto con el Cliente

El mensaje del cliente dice:
> "Con esa API puedo actualizar en tiempo real los precios y stock de los productos, que se relaciona con el sistema DE VENTAS DE CLIENTE"

✅ **FUNCIONALIDAD IMPLEMENTADA CORRECTAMENTE**

Ahora puedes:
1. Solicitar tokens usando el usuario "Raymir" o "raymir"
2. Actualizar precios y stock en tiempo real
3. Sincronizar productos individuales o todos a la vez
4. Mantener tu base de datos local sincronizada con el sistema de ventas del cliente

---

**Desarrollador**: Antigravity AI Assistant  
**Fecha**: 2026-01-15  
**Versión**: 1.0.0
