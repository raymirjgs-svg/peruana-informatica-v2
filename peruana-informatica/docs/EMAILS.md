# 📧 Sistema de Emails

## Descripción

El sistema de emails envía notificaciones automáticas a clientes y administradores durante el flujo de compra.

---

## ⚙️ Configuración

### Variables de entorno

En `backend/.env`:

```env
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Email del administrador
ADMIN_EMAIL=admin@peruanainformatica.com

# URL del panel admin
ADMIN_URL=http://localhost:3000/admin
```

### Configurar Gmail

1. Ve a tu cuenta de Google
2. Activa **Verificación en 2 pasos**
3. Ve a: https://myaccount.google.com/apppasswords
4. Genera una "Contraseña de aplicación"
5. Usa esa contraseña en `SMTP_PASS`

### Otros proveedores SMTP

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu-access-key
SMTP_PASS=tu-secret-key
```

---

## 📁 Estructura del Código

### EmailService

**Archivo:** `backend/src/services/EmailService.ts`

```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderConfirmation(order: Order) { ... }
  async sendPaymentVerified(order: Order) { ... }
  async sendInvoice(order: Order, invoicePath: string) { ... }
  async notifyAdmin(order: Order) { ... }
}
```

---

## 📨 Tipos de Emails

### 1. Confirmación de Pedido (Cliente)

**Cuándo se envía:** Al crear un nuevo pedido

**Contenido:**
- Número de pedido
- Detalle de productos
- Total a pagar
- Instrucciones de pago
- Datos bancarios

**Ejemplo:**
```
Asunto: ¡Gracias por tu pedido! #ORD-20251223-001

Hola Juan,

Tu pedido ha sido recibido exitosamente.

📦 DETALLE DEL PEDIDO
- Laptop Gaming x1 - S/ 3,500.00
- Mouse Gamer x2 - S/ 200.00

💰 TOTAL: S/ 3,700.00

📝 INSTRUCCIONES DE PAGO
Realiza la transferencia a:
Banco: BCP
Cuenta: 123-456789-0-12
...
```

### 2. Notificación al Administrador

**Cuándo se envía:** Al crear un nuevo pedido

**Contenido:**
- Datos del cliente
- Detalle del pedido
- Total
- Link al panel admin

### 3. Pago Verificado (Cliente)

**Cuándo se envía:** Cuando el admin verifica el pago

**Contenido:**
- Confirmación de pago recibido
- Próximos pasos
- Tiempo estimado de envío

### 4. Factura/Boleta (Cliente)

**Cuándo se envía:** Cuando el admin genera el comprobante

**Contenido:**
- PDF adjunto
- Link de descarga alternativo
- Información de contacto

---

## 🔧 Uso en Controladores

### Al crear pedido

```typescript
// OrderController.ts
import { EmailService } from '../services/EmailService';

const emailService = new EmailService();

async createOrder(req, res) {
  // ... crear pedido ...
  
  // Enviar emails
  await emailService.sendOrderConfirmation(order);
  await emailService.notifyAdmin(order);
  
  res.json({ success: true });
}
```

### Al verificar pago

```typescript
// PaymentController.ts
async verifyPayment(req, res) {
  // ... verificar pago ...
  
  await emailService.sendPaymentVerified(order);
  
  res.json({ success: true });
}
```

### Al generar factura

```typescript
// PaymentController.ts
async generateInvoice(req, res) {
  // ... generar PDF ...
  
  await emailService.sendInvoice(order, invoicePath);
  
  res.json({ success: true });
}
```

---

## 🎨 Plantillas HTML

Los emails usan plantillas HTML inline para compatibilidad con todos los clientes de correo.

### Estructura básica

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #1a365d; color: white; padding: 20px; }
    .content { padding: 20px; }
    .footer { background: #f7fafc; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Peruana Informática</h1>
  </div>
  <div class="content">
    <!-- Contenido dinámico -->
  </div>
  <div class="footer">
    <p>© 2025 Peruana Informática</p>
  </div>
</body>
</html>
```

---

## 📎 Adjuntos

### Enviar PDF adjunto

```typescript
async sendInvoice(order: Order, invoicePath: string) {
  await this.transporter.sendMail({
    from: '"Peruana Informática" <noreply@peruanainformatica.com>',
    to: order.customer_email,
    subject: `Tu comprobante - Pedido #${order.order_number}`,
    html: htmlContent,
    attachments: [
      {
        filename: `${order.invoice_type}-${order.invoice_number}.pdf`,
        path: invoicePath
      }
    ]
  });
}
```

---

## 🧪 Pruebas

### Probar conexión SMTP

```typescript
// En el servidor, al iniciar
const emailService = new EmailService();
emailService.transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error SMTP:', error);
  } else {
    console.log('✅ SMTP configurado correctamente');
  }
});
```

### Usar Mailtrap (desarrollo)

Para pruebas sin enviar emails reales:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu-usuario-mailtrap
SMTP_PASS=tu-password-mailtrap
```

---

## 🐛 Solución de Problemas

### Error de autenticación
- Verificar usuario y contraseña
- Para Gmail, usar "Contraseña de aplicación"
- Verificar que 2FA esté habilitado

### Email cae en spam
- Configurar SPF, DKIM y DMARC en el dominio
- Usar un dominio propio, no @gmail.com
- Evitar palabras spam en el asunto

### Timeout al enviar
- Verificar puerto (587 para TLS, 465 para SSL)
- Verificar firewall del servidor
- Probar con otra red

### Adjunto no llega
- Verificar que el archivo existe
- Verificar tamaño máximo (generalmente 25MB)
- Verificar ruta absoluta del archivo
