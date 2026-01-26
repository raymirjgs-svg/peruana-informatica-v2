# 🖥️ Frontend - Peruana Informática

Aplicación web construida con Next.js 15, React 18 y Tailwind CSS.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── admin/              # Panel de administración
│   │   │   ├── products/       # Gestión de productos
│   │   │   ├── orders/         # Gestión de pedidos
│   │   │   ├── categories/     # Gestión de categorías
│   │   │   ├── brands/         # Gestión de marcas
│   │   │   ├── blog/           # Gestión de blog
│   │   │   └── page.tsx        # Dashboard
│   │   ├── blog/               # Blog público
│   │   ├── cart/               # Carrito y checkout
│   │   ├── products/           # Catálogo de productos
│   │   │   ├── [slug]/         # Detalle de producto
│   │   │   └── page.tsx        # Lista de productos
│   │   ├── categories/         # Páginas de categorías
│   │   ├── brands/             # Páginas de marcas
│   │   ├── globals.css         # Estilos globales
│   │   ├── layout.tsx          # Layout principal
│   │   └── page.tsx            # Página de inicio
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Componentes UI básicos
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── products/           # Componentes de productos
│   │   ├── cart/               # Componentes del carrito
│   │   └── admin/              # Componentes del admin
│   │
│   ├── store/                  # Estado global (Zustand)
│   │   └── cartStore.ts        # Estado del carrito
│   │
│   ├── lib/                    # Utilidades
│   │   ├── api.ts              # Cliente Axios configurado
│   │   └── utils.ts            # Funciones helper
│   │
│   ├── types/                  # Tipos TypeScript
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── index.ts
│   │
│   └── styles/                 # Estilos adicionales
│       └── variables.css
│
├── public/                     # Archivos estáticos
│   └── images/
│
├── .env.local                  # Variables de entorno
├── tailwind.config.js          # Configuración Tailwind
├── next.config.js              # Configuración Next.js
└── package.json
```

---

## ⚙️ Variables de Entorno

Crear archivo `.env.local`:

```env
# URL del Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎨 Sistema de Estilos

El proyecto usa **Tailwind CSS** para estilos utility-first.

### Configuración

**Archivo:** `tailwind.config.js`

```javascript
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Personalizaciones aquí
    },
  },
  plugins: [],
}
```

### Uso en componentes

```tsx
// Estilos con clases de Tailwind
<button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
  Comprar
</button>
```

### Clases personalizadas

En `globals.css` se pueden agregar clases personalizadas:

```css
@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg;
  }
}
```

---

## 🛒 Estado Global (Zustand)

### Carrito de Compras

**Archivo:** `src/store/cartStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => { ... },
      removeItem: (productId) => { ... },
      // ...
    }),
    { name: 'cart-storage' }
  )
);
```

### Uso en componentes

```tsx
import { useCartStore } from '@/store/cartStore';

function ProductCard({ product }) {
  const { addItem, items } = useCartStore();
  
  return (
    <button onClick={() => addItem(product, 1)}>
      Agregar ({items.length})
    </button>
  );
}
```

---

## 📡 API Client

### Configuración de Axios

**Archivo:** `src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token (admin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Uso

```typescript
import api from '@/lib/api';

// GET
const products = await api.get('/products');

// POST
const order = await api.post('/orders', orderData);
```

---

## 📱 Páginas Principales

| Ruta | Descripción |
|------|-------------|
| `/` | Página de inicio |
| `/products` | Catálogo de productos |
| `/products/[slug]` | Detalle de producto |
| `/categories/[slug]` | Productos por categoría |
| `/brands/[slug]` | Productos por marca |
| `/cart` | Carrito y checkout |
| `/blog` | Lista de artículos |
| `/blog/[slug]` | Artículo completo |
| `/admin` | Dashboard admin |
| `/admin/products` | Gestión productos |
| `/admin/orders` | Gestión pedidos |
| `/admin/blog` | Gestión blog |

---

## 🔧 Scripts

```bash
# Desarrollo (con Turbopack)
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Lint
npm run lint
```

---

## 📦 Dependencias Principales

| Paquete | Uso |
|---------|-----|
| next | Framework React SSR |
| react | Librería UI |
| tailwindcss | Estilos utility-first |
| zustand | Estado global |
| axios | Cliente HTTP |
| lucide-react | Iconos |
| sonner | Notificaciones toast |

---

## 💡 Convenciones

### Componentes

```tsx
// Usar functional components con TypeScript
interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Nombres de archivos

- Componentes: `PascalCase.tsx` (ProductCard.tsx)
- Utilidades: `camelCase.ts` (formatPrice.ts)
- Páginas: `page.tsx` (convención Next.js)

---

## 🐛 Solución de Problemas

### Hydration error
- Verificar que el estado inicial sea igual en servidor y cliente
- Usar `useEffect` para código que depende del cliente

### Imágenes no cargan
- Verificar configuración de `next.config.js`
- Agregar dominios externos permitidos

### Estilos no aplican
- Verificar que Tailwind esté configurado
- Verificar que las clases existan
