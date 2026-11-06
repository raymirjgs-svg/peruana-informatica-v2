# 🖥️ Peruana Informática - E-Commerce

Sistema de comercio electrónico completo para venta de productos de tecnología, desarrollado con Next.js 15 y Node.js/Express.

## 📋 Índice

- [Descripción General](#descripción-general)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación Rápida](#instalación-rápida)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Guías Detalladas](#guías-detalladas)

---

## 🎯 Descripción General

Peruana Informática es una plataforma e-commerce que permite:

- **Clientes**: Navegar productos, agregar al carrito, realizar pedidos
- **Administradores**: Gestionar productos, pedidos, categorías, marcas y contenido del blog
- **Integración ERP**: Sincronización automática con sistema ERP externo
- **IA**: Generación de contenido con Google Gemini

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 15.5.5 | Framework React con SSR |
| React | 18 | Librería UI |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 3 | Estilos utility-first |
| Zustand | 4 | Estado global (carrito) |
| Axios | 1.7 | Cliente HTTP |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.21 | Framework web |
| TypeScript | 5 | Tipado estático |
| Sequelize | 6 | ORM para MySQL |
| MySQL | 8 | Base de datos |
| Nodemailer | 6 | Envío de emails |
| Google Generative AI | 0.21 | IA para contenido |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│                    (Navegador Web)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js)                           │
│                 http://localhost:3000                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Tienda  │  │  Admin   │  │  Blog    │  │  Carrito │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ API REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express)                           │
│                 http://localhost:3001                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Routes  │  │Controllers│  │ Services │  │  Models  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────┐           ┌───────────────────┐
│    MySQL      │           │  Servicios Ext.   │
│   Database    │           │  - ERP API        │
│               │           │  - Gemini AI      │
│               │           │  - SMTP Email     │
└───────────────┘           └───────────────────┘
```

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Node.js 18 o superior
- MySQL 8
- npm o yarn

### 1. Clonar e instalar dependencias

```bash
# Backend
cd peruana-informatica/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=peruana_informatica
DATABASE_USER=root
DATABASE_PASSWORD=tu_password

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
ADMIN_EMAIL=admin@tudominio.com

# IA (opcional)
GEMINI_API_KEY=tu-api-key

# ERP (opcional)
ERP_API_URL=https://tu-erp.com/api
ERP_API_TOKEN=tu-token
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Iniciar servidores

```bash
# Terminal 1 - Backend
cd peruana-informatica/backend
npm run dev

# Terminal 2 - Frontend
cd ../frontend
npm run dev
```

### 4. Acceder
- **Tienda**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:3001

---

## 📁 Estructura del Proyecto

```
peruana-informatica_v2/
├── docs/                       # Documentación Técnica y de Despliegue
│   ├── technical/              # API, Auth, Negocio
│   ├── deployment/             # Guías de despliegue
│   └── archive/                # Histórico
├── scripts/                    # Scripts de utilidad
├── peruana-informatica/        # Código Fuente
│   ├── backend/                # API REST
│   │   ├── src/
│   │   └── .env
│   └── frontend/               # Aplicación Next.js
│       ├── src/
│       └── .env.local
└── README.md                   # Documentación Principal
```

---

## ✨ Funcionalidades

### 🛒 Tienda (Público)
- Catálogo de productos con filtros
- Búsqueda de productos
- Carrito de compras persistente
- Proceso de checkout
- Múltiples métodos de pago
- Blog de tecnología

### 👨‍💼 Panel de Administración
- Dashboard con estadísticas
- Gestión de productos (CRUD)
- Gestión de categorías y marcas
- Gestión de pedidos
- Gestión de blog con IA
- Sincronización con ERP

### 📧 Sistema de Emails
- Confirmación de pedido al cliente
- Notificación al administrador
- Confirmación de pago
- Envío de facturas/boletas

### 🤖 Inteligencia Artificial
- Generación de títulos para blog
- Generación de contenido completo
- Sugerencias de metadatos SEO

---

## 📚 Guías Detalladas

- [📦 Sistema de Productos](./docs/technical/PRODUCTOS.md)
- [🛒 Flujo de Compras](./docs/technical/COMPRAS.md)
- [📧 Configuración de Emails](./docs/technical/EMAILS.md)
- [🤖 IA con Gemini](./docs/technical/IA.md)
- [🔄 Sincronización ERP](./docs/technical/ERP.md)
- [🔐 Autenticación](./docs/technical/AUTH.md)
- [📊 API Reference](./docs/technical/API.md)
- [🚀 Guía de Despliegue](./docs/deployment/DEPLOY.md)

---

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Producción
npm run init-db  # Inicializar base de datos
```

### Frontend
```bash
npm run dev      # Desarrollo con Turbopack
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # Verificar código
```

---

## 📞 Soporte

Para problemas o dudas:
1. Revisa la documentación en `/docs`
2. Verifica los logs del servidor
3. Consulta los archivos `.env.example`

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2025
