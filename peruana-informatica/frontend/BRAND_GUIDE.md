# 🎨 GUÍA DE ESTILO - PERUANA INFORMÁTICA

## Paleta de Colores Corporativa

### 🎯 Colores Principales

| Color | Hex | Uso Recomendado | Psicología |
|-------|-----|----------------|------------|
| **Rojo Principal** | `#dc2626` | Botones CTA, ofertas, acciones urgentes | Energía, acción, urgencia |
| **Negro Premium** | `#1a1a1a` | Fondos principales, headers, footers | Elegancia, autoridad, tecnología |
| **Plomo Profesional** | `#1e293b` | Navegación, sidebars, secciones | Profesionalismo, estabilidad |
| **Gris Neutro** | `#6b7280` | Texto secundario, borders, backgrounds | Balance, neutralidad |

---

## 📐 Sistema de Aplicación de Colores

### 1️⃣ **ROJO (Acción y Conversión)**

#### ✅ Dónde USAR:
```tsx
// Botones principales
<button className="bg-brand-red-600 hover:bg-brand-red-700 text-white">
  Comprar Ahora
</button>

// Con gradiente para mayor impacto
<button className="bg-gradient-brand text-white shadow-brand-red">
  Agregar al Carrito
</button>

// Badges de ofertas
<span className="bg-brand-red-100 text-brand-red-800 px-3 py-1 rounded-full">
  -50% OFF
</span>

// Iconos de acción
<Heart className="text-brand-red-600 w-5 h-5" />

// Alertas urgentes
<div className="bg-brand-red-50 border-l-4 border-brand-red-600 p-4">
  ¡Solo quedan 3 unidades!
</div>
```

#### ❌ Dónde NO usar:
- Texto corrido (dificulta lectura)
- Fondos grandes (fatiga visual)
- Enlaces normales (reservar para CTAs importantes)

---

### 2️⃣ **NEGRO (Premium y Autoridad)**

#### ✅ Dónde USAR:
```tsx
// Header principal
<header className="bg-brand-black-800 text-white">

// Navbar con gradiente sutil
<nav className="bg-gradient-header">

// Footer
<footer className="bg-brand-black-900">

// Títulos importantes
<h1 className="text-brand-black-800 dark:text-white">

// Productos premium
<div className="bg-brand-black-700 text-white rounded-lg p-6">
```

---

### 3️⃣ **PLOMO (Profesional y Moderno)**

#### ✅ Dónde USAR:
```tsx
// Sidebars
<aside className="bg-brand-slate-800">

// Tarjetas de productos
<div className="bg-white border border-brand-slate-200 hover:border-brand-slate-400">

// Navegación secundaria
<nav className="bg-brand-slate-900 border-b border-brand-slate-700">

// Fondos alternativos
<section className="bg-brand-slate-50">
```

---

### 4️⃣ **GRIS (Texto y Balance)**

#### ✅ Dónde USAR:
```tsx
// Texto secundario
<p className="text-brand-gray-600">

// Texto descriptivo
<span className="text-brand-gray-500 text-sm">

// Bordes sutiles
<div className="border border-brand-gray-200">

// Fondos de inputs
<input className="bg-brand-gray-50 border-brand-gray-300">
```

---

## 🎨 Ejemplos de Componentes Completos

### Botón Principal (CTA)
```tsx
<button className="
  bg-brand-red-600 
  hover:bg-brand-red-700 
  active:bg-brand-red-800
  text-white 
  font-semibold 
  px-6 py-3 
  rounded-lg 
  shadow-brand-red 
  transition-all 
  duration-300
  hover:-translate-y-1
">
  Comprar Ahora
</button>
```

### Botón Secundario
```tsx
<button className="
  bg-brand-slate-800 
  hover:bg-brand-slate-700 
  text-white 
  px-6 py-3 
  rounded-lg 
  transition-colors
">
  Ver Detalles
</button>
```

### Botón con Gradiente
```tsx
<button className="
  bg-gradient-brand 
  text-white 
  px-8 py-4 
  rounded-lg 
  shadow-brand-lg 
  hover:shadow-brand-red 
  transition-all
  hover:scale-105
">
  Ofertas Especiales
</button>
```

### Card de Producto
```tsx
<div className="
  bg-white 
  border border-brand-gray-200 
  hover:border-brand-red-400
  rounded-xl 
  shadow-brand-md 
  hover:shadow-brand-lg
  transition-all
  overflow-hidden
">
  {/* Contenido */}
</div>
```

### Badge de Oferta
```tsx
<span className="
  inline-flex items-center
  bg-gradient-brand 
  text-white 
  px-3 py-1 
  rounded-full 
  text-xs 
  font-bold
  shadow-brand-red
  animate-pulse
">
  ¡OFERTA!
</span>
```

### Badge de Estado (Stock Bajo)
```tsx
<span className="
  inline-flex items-center gap-1
  bg-brand-red-100 
  text-brand-red-800 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-semibold
">
  <AlertCircle className="w-4 h-4" />
  Solo quedan 3
</span>
```

### Badge de Disponible
```tsx
<span className="
  inline-flex items-center gap-1
  bg-green-100 
  text-green-800 
  px-3 py-1 
  rounded-full 
  text-sm
">
  <CheckCircle className="w-4 h-4" />
  En Stock
</span>
```

---

## 🎯 Reglas de Uso

### ✅ HACER:
1. **Usar Rojo para acciones de conversión** (Comprar, Agregar al carrito, Ofertas)
2. **Usar Negro/Plomo para navegación y estructura**
3. **Usar Gris para jerarquía de texto**
4. **Máximo 2 gradientes en toda la página**
5. **Mantener alto contraste para accesibilidad**

### ❌ NO HACER:
1. **Mezclar más de 3 colores en un mismo componente**
2. **Usar rojo en texto largo** (fatiga visual)
3. **Fondos oscuros sin suficiente contraste de texto**
4. **Gradientes en textos pequeños**
5. **Botones grises para acciones principales**

---

## 🌓 Modo Oscuro

```tsx
// Texto adaptativo
<h2 className="text-brand-black-800 dark:text-white">

// Fondo adaptativo
<div className="bg-white dark:bg-brand-slate-900">

// Border adaptativo
<div className="border-brand-gray-200 dark:border-brand-slate-700">
```

---

## 🎨 Gradientes Oficiales

```tsx
// Gradiente de Marca (Rojo)
bg-gradient-brand
// Linear: #dc2626 → #b91c1c

// Gradiente Oscuro (Negro a Plomo)
bg-gradient-dark
// Linear: #1a1a1a → #1e293b

// Gradiente Header (Negro con profundidad)
bg-gradient-header
// Linear: #0a0a0a → #0f172a → #0a0a0a

// Gradiente Sutil (Plomo)
bg-gradient-subtle
// Linear: #1e293b → #0f172a
```

---

## 📊 Jerarquía Visual

```
1. ROJO (Máxima prioridad)
   ↓ Botones CTA, Ofertas, Urgencia
   
2. NEGRO (Alta prioridad)
   ↓ Headers, Títulos principales
   
3. PLOMO (Media prioridad)
   ↓ Navegación, Estructura
   
4. GRIS (Baja prioridad)
   ↓ Texto, Borders, Backgrounds
```

---

## 🔧 Clases Utilitarias Personalizadas

Ya disponibles en `brand.css`:

- `.btn-primary` - Botón rojo principal
- `.btn-secondary` - Botón plomo/gris
- `.btn-gradient` - Botón con gradiente de marca
- `.badge-red` - Badge rojo claro
- `.badge-new` - Badge con animación
- `.link-brand` - Enlace con estilo de marca
- `.bg-gradient-brand` - Gradiente de marca
- `.bg-gradient-dark` - Gradiente oscuro

---

## 📱 Responsive

Los colores mantienen su significado en todos los tamaños:
- **Móvil**: Rojo solo en CTAs principales
- **Tablet**: Balance 60/40 (Oscuros/Rojo)
- **Desktop**: Balance 70/30 (Oscuros/Rojo)

---

## ♿ Accesibilidad

### Ratios de Contraste (WCAG AA):

| Combinación | Ratio | Estado |
|-------------|-------|--------|
| Blanco sobre Rojo 600 | 4.8:1 | ✅ AA |
| Negro 800 sobre Blanco | 18.2:1 | ✅ AAA |
| Gris 600 sobre Blanco | 5.7:1 | ✅ AA |
| Rojo 600 sobre Negro 800 | 3.8:1 | ⚠️ Usar con cautela |

---

## 🚀 Implementación Rápida

### Importar en tu componente:
```tsx
import '@/styles/brand.css';
```

### Usar las clases:
```tsx
<button className="btn-primary">Mi Botón</button>
```

### O usar Tailwind directamente:
```tsx
<button className="bg-brand-red-600 text-white">Mi Botón</button>
```

---

**Última actualización:** Febrero 2026
**Autor:** Equipo de Desarrollo Peruana Informática
