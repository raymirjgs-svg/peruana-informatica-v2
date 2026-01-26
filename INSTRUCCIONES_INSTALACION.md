# 📦 INSTRUCCIONES DE INSTALACIÓN - FLUJO DE COMPRAS MEJORADO

## 🎯 Nuevas Funcionalidades Implementadas

### 1. **Sistema de Emails Automáticos**
- ✅ Email al cliente al crear pedido
- ✅ Email al operador/admin cuando hay nuevo pedido
- ✅ Email al cliente cuando se verifica el pago
- ✅ Email al cliente con la factura/boleta adjunta

### 2. **Formas de Pago Mejoradas**
- ✅ Información detallada por cada método (Transferencia, Yape, Plin, Tarjeta)
- ✅ Interfaz visual mejorada con colores distintivos
- ✅ Indicador de método seleccionado

### 3. **Sistema de Descarga de Comprobantes**
- ✅ Endpoint para que el cliente descargue su factura/boleta
- ✅ Endpoint para consultar estado del pedido

---

## 🔧 INSTALACIÓN

### Paso 1: Instalar Dependencias de Email

```bash
cd backend
npm install nodemailer @types/nodemailer
```

### Paso 2: Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-aqui

# Email del administrador
ADMIN_EMAIL=admin@peruanainformatica.com

# Admin Panel URL
ADMIN_URL=http://localhost:3000/admin
```

### Paso 3: Configurar Gmail (si usas Gmail)

1. Ve a tu cuenta de Google
2. Activa la verificación en 2 pasos
3. Genera una "Contraseña de aplicación":
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Copia la contraseña generada
   - Úsala en `SMTP_PASS`

### Paso 4: Reiniciar el Servidor

```bash
npm run dev
```

---

## 📧 CONFIGURACIÓN DE EMAILS

### Plantillas Implementadas

#### 1. **Email de Confirmación al Cliente**
- Se envía al crear el pedido
- Incluye:
  - Número de pedido
  - Detalle de productos
  - Total a pagar
  - Datos bancarios para transferencia
  - Próximos pasos

#### 2. **Email de Notificación al Operador**
- Se envía al crear el pedido
- Incluye:
  - Datos del cliente
  - Detalle del pedido
  - Total
  - Link al panel admin

#### 3. **Email de Pago Verificado**
- Se envía cuando el admin verifica el pago
- Confirma que el pedido está siendo procesado

#### 4. **Email con Factura/Boleta**
- Se envía cuando el admin genera el comprobante
- Incluye el PDF adjunto
- El cliente también puede descargarlo desde la web

---

## 🔗 NUEVOS ENDPOINTS

### Para Clientes

#### Consultar Pedido
```
GET /api/client/orders/:id
```

**Respuesta:**
```json
{
  "id": 1,
  "customer_name": "Juan Pérez",
  "customer_email": "juan@example.com",
  "total_amount": 2500.00,
  "status": "processed",
  "payment_status": "verified",
  "payment_method": "transferencia",
  "invoice_type": "boleta",
  "invoice_number": "B001-00000123",
  "invoice_file": "boleta-123-1234567890.pdf",
  "has_invoice": true,
  "items": [...],
  "createdAt": "2024-12-22T10:00:00.000Z"
}
```

#### Descargar Comprobante
```
GET /api/client/orders/:id/invoice
```

Descarga directamente el archivo PDF de la factura/boleta.

---

## 🎨 MEJORAS EN EL FRONTEND

### Página de Pago (`/cart`)

#### Información Dinámica por Método de Pago

- **Transferencia Bancaria**: Muestra datos de cuenta BCP
- **Yape**: Muestra número y titular
- **Plin**: Muestra número y titular
- **Tarjeta**: Información sobre tarjetas aceptadas

#### Página de Éxito

- Confirma envío de email
- Muestra próximos pasos detallados
- Botón para ver el pedido
- Consejo para consultar estado

---

## 📋 FLUJO COMPLETO

```
1. Cliente agrega productos al carrito
   ↓
2. Cliente ingresa sus datos
   ↓
3. Sistema crea pedido
   ├─→ Email al cliente (confirmación)
   └─→ Email al operador (notificación)
   ↓
4. Cliente sube comprobante de pago
   ↓
5. Operador verifica pago en panel admin
   └─→ Email al cliente (pago verificado)
   ↓
6. Operador genera factura/boleta
   └─→ Email al cliente (con PDF adjunto)
   ↓
7. Cliente puede descargar comprobante desde:
   - Email recibido
   - Página de consulta de pedido
```

---

## 🔍 PRUEBAS

### 1. Probar Creación de Pedido

```bash
# Frontend
http://localhost:3000/cart

# Agregar productos y completar el flujo
# Verificar que lleguen los emails
```

### 2. Probar Verificación de Pago

```bash
# Panel Admin (cuando esté implementado)
http://localhost:3000/admin/orders

# O directamente con la API:
curl -X PATCH http://localhost:3002/api/admin/payments/1/verify \
  -H "Content-Type: application/json" \
  -d '{"verified": true, "verified_by": "Admin"}'
```

### 3. Probar Generación de Factura

```bash
curl -X POST http://localhost:3002/api/admin/payments/1/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{"invoice_number": "B001-00000001"}'
```

### 4. Probar Descarga de Comprobante

```bash
# Consultar pedido
curl http://localhost:3002/api/client/orders/1

# Descargar comprobante
curl http://localhost:3002/api/client/orders/1/invoice --output comprobante.pdf
```

---

## ⚠️ NOTAS IMPORTANTES

### Errores de Lint (Temporales)

Los siguientes errores de TypeScript son normales hasta que instales las dependencias:

```
Cannot find module 'nodemailer'
```

**Solución:** Ejecuta `npm install nodemailer @types/nodemailer`

### Configuración de Producción

Para producción, considera:

1. **Usar un servicio de email profesional:**
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

2. **Configurar dominio propio:**
   - Evita que los emails caigan en spam
   - Mejora la confianza del cliente

3. **Variables de entorno seguras:**
   - No subas el archivo `.env` a Git
   - Usa variables de entorno del servidor

---

## 📊 ARCHIVOS MODIFICADOS/CREADOS

### Backend

**Nuevos:**
- `src/services/EmailService.ts` - Servicio de emails
- `src/controllers/ClientController.ts` - Controlador para clientes
- `src/routes/clientRoutes.ts` - Rutas para clientes
- `.env.example` - Ejemplo de variables de entorno

**Modificados:**
- `src/controllers/OrderController.ts` - Envío de emails al crear pedido
- `src/controllers/admin/PaymentController.ts` - Envío de emails al verificar/generar
- `src/server.ts` - Registro de rutas de cliente

### Frontend

**Modificados:**
- `src/app/cart/page.tsx` - Mejoras en formas de pago y página de éxito

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. ✅ **Implementar autenticación admin** (JWT)
2. ✅ **Agregar control de stock** en pedidos
3. ✅ **Crear página de consulta de pedido** para clientes
4. ⚠️ **Testing** de flujo completo
5. ⚠️ **Documentación de API** con Swagger

---

## 📞 SOPORTE

Si tienes problemas con la configuración de emails:

1. Verifica que las credenciales SMTP sean correctas
2. Revisa los logs del servidor para errores
3. Prueba con un servicio de email de prueba (Mailtrap, Ethereal)

---

**Fecha de implementación:** 22 de Diciembre, 2025  
**Versión:** 1.0
