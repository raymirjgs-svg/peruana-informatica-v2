# Reporte de Entrega — Proyectos Web 2026

DOCUMENTO CONFIDENCIAL

# Reporte de Entrega

Proyectos Web — Servidor de Producción

🛒

Peruana de Informática

peruanadeinformatica.com.pe

🎮

Katsher

katsher.com

💼

Magnatte

magnatte.es

Generado el 3 de Marzo de 2026 &nbsp;|&nbsp; Servidor: 168.181.186.63 &nbsp;|&nbsp; Ubuntu 24.04 LTS

🛒

## Peruana de Informática

https://peruanadeinformatica.com.pe

### Información del Servidor

| URL Principal |[https://peruanadeinformatica.com.pe](https://peruanadeinformatica.com.pe) |

| Servidor |VPS Ubuntu 24.04 LTS — IP 168.181.186.63 |

| SSL / HTTPS |✅ Activo — Let's Encrypt, vence 01/06/2026 |

| Renovación SSL |Automática (sin intervención manual) |

| Base de Datos |MySQL 8 — 1,191 productos importados |

### Páginas Principales

Inicio

[/](https://peruanadeinformatica.com.pe)

Productos

[/productos](https://peruanadeinformatica.com.pe/productos)

Categorías

[/categorias](https://peruanadeinformatica.com.pe/categorias)

Marcas

[/marcas](https://peruanadeinformatica.com.pe/marcas)

Carrito

[/carrito](https://peruanadeinformatica.com.pe/carrito)

Mi Cuenta

[/cuenta](https://peruanadeinformatica.com.pe/cuenta)

Blog

[/blog](https://peruanadeinformatica.com.pe/blog)

Contacto

[/contacto](https://peruanadeinformatica.com.pe/contacto)

### Acceso al Panel de Administración

| URL del Admin |[https://peruanadeinformatica.com.pe/admin](https://peruanadeinformatica.com.pe/admin) |

| Email |admin@peruanadeinformatica.com |

| Contraseña |Peruana2026! |

    **⚠️ Importante**
    Se recomienda cambiar la contraseña después del primer ingreso exitoso en **Admin → Perfil → Cambiar Contraseña**.

### Correo Electrónico

| Servidor de correo |Donweb / Hostmar (sin cambios) |

| Cuentas activas |@peruanadeinformatica.com.pe (sin modificar) |

| Estado |✅ Funcionando — Los registros MX no fueron tocados |

    El servicio de correo opera de forma independiente al servidor web. El cambio de DNS solo afectó los registros A (dirección web) — los registros MX, DKIM y SPF permanecen iguales.

### Configuración de Medios de Pago — Mercado Pago

#### Mercado Pago

La plataforma está preparada para recibir pagos con tarjeta de crédito/débito, transferencias y otros métodos a través de Mercado Pago. Solo es necesario vincular la cuenta del negocio.

Pasos para activar los pagos:

- 

        **Crear o acceder a la cuenta de Mercado Pago del negocio**
        Ingresar a [mercadopago.com.pe](https://www.mercadopago.com.pe) con la cuenta de la empresa (o crear una nueva si no existe).

    

- 

        **Obtener las credenciales de producción**
        Ir a **Tu negocio → Configuración → Credenciales** y copiar el `Access Token de producción` (empieza con `APP_USR-...`). No confundir con las credenciales de prueba/sandbox.

    

- 

        **Ingresar al servidor y editar el archivo de configuración**
        El administrador del servidor debe acceder por SSH (IP: `168.181.186.63`) y editar el archivo:****
        `/root/projects/peruana-informatica-v2/envs/.env.production`****
        Buscar la línea:**
        `MP_ACCESS_TOKEN=`**
        Y reemplazar el valor con el Access Token copiado en el paso anterior.

    

- 

        **Reiniciar el backend para aplicar los cambios**
        Ejecutar el siguiente comando en el servidor:****
        `cd /root/projects/peruana-informatica-v2 && docker compose -f docker-compose.prod.yml up -d --no-build backend`

    

- 

        **Verificar desde el panel de administración**
        Ingresar al admin en [/admin/pagos](https://peruanadeinformatica.com.pe/admin/pagos) o realizar un pago de prueba desde la tienda para confirmar que los pagos se procesan correctamente.

    
  

    **⚠️ Nunca compartir el Access Token**
    El Access Token de Mercado Pago da acceso completo a la cuenta de cobros. No debe enviarse por correo, WhatsApp ni compartirse con terceros. Solo debe ingresarse directamente en el servidor.

    **Alternativa sin acceso al servidor:** El administrador del panel puede solicitar al equipo técnico que configure la variable de entorno. Solo es necesario proporcionar el Access Token de forma segura (por ejemplo, por llamada telefónica o mensaje cifrado).

🎮

## Katsher

https://www.katsher.com

### Información del Servidor

| URL Principal |[https://www.katsher.com](https://www.katsher.com) |

| Servidor |VPS Ubuntu 24.04 LTS — IP 168.181.186.63 |

| SSL / HTTPS |✅ Activo — Let's Encrypt, vence 01/06/2026 |

| Renovación SSL |Automática |

| Base de Datos |MySQL 8 — Productos, categorías e imágenes importados |

    **📌 Nota sobre el dominio**
    El SSL está activo para **www.katsher.com**. Cuando el DNS de **katsher.com** (sin www) propague completamente, el certificado se expandirá automáticamente para cubrir ambos dominios.

### Páginas Principales

Inicio

[www.katsher.com](https://www.katsher.com)

Productos

[/productos](https://www.katsher.com/productos)

Tecnología

[/tecnologia](https://www.katsher.com/tecnologia)

Comunidad

[/comunidad](https://www.katsher.com/comunidad)

Contacto

[/contacto](https://www.katsher.com/contacto)

Panel Admin

[/admin](https://www.katsher.com/admin)

### Acceso al Panel de Administración

| URL del Admin |[https://www.katsher.com/admin](https://www.katsher.com/admin) |

| Email |admin@katsher.com |

| Contraseña |Katsher2026! |

    **⚠️ Importante**
    Se recomienda cambiar la contraseña después del primer ingreso.

💼

## Magnatte

https://magnatte.es

### Información del Servidor

| URL Principal |[https://magnatte.es](https://magnatte.es) |

| Servidor |VPS Ubuntu 24.04 LTS — IP 168.181.186.63 |

| SSL / HTTPS |✅ Activo — Let's Encrypt, vence 01/06/2026 |

| Renovación SSL |Automática |

| Base de Datos |MySQL 8 — Productos, categorías e imágenes importados |

### Páginas Principales

Inicio

[magnatte.es](https://magnatte.es)

Productos

[/productos](https://magnatte.es/productos)

Nosotros

[/about](https://magnatte.es/about)

Servicios

[/services](https://magnatte.es/services)

Contacto

[/contact](https://magnatte.es/contact)

Panel Admin

[/admin](https://magnatte.es/admin)

### Acceso al Panel de Administración

| URL del Admin |[https://magnatte.es/admin](https://magnatte.es/admin) |

| Email |admin@magnatte.es |

| Contraseña |Magnatte2026! |

    **⚠️ Importante**
    Se recomienda cambiar la contraseña después del primer ingreso.

### Resumen del Servidor

| 
      Proyecto |
      Dominio |
      SSL |
      Estado |
    

| 
      Peruana de Informática |
      peruanadeinformatica.com.pe |
      ✅ Activo |
      ✅ Online |
    

| 
      Katsher |
      www.katsher.com |
      ✅ Activo |
      ✅ Online |
    

| 
      Magnatte |
      magnatte.es |
      ✅ Activo |
      ✅ Online |
    

  Reporte generado el 3 de Marzo de 2026 &nbsp;·&nbsp; Servidor 168.181.186.63 &nbsp;·&nbsp; Documento Confidencial
