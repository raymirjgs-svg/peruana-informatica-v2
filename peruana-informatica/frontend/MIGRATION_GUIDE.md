# 🔄 GUÍA DE MIGRACIÓN - Aplicar Colores de Marca

## Cambios Implementados

✅ **Archivos Creados:**
- `/src/styles/brand.css` - Sistema completo de colores
- `/frontend/BRAND_GUIDE.md` - Guía de uso
- `/frontend/tailwind.config.js` - Actualizado con paleta brand

✅ **Archivos Actualizados:**
- `/src/app/globals.css` - Importa brand.css
- `/src/components/product/ProductFilters.tsx` - **EJEMPLO COMPLETO**

---

## 🎯 Pasos para Migrar Todo el Proyecto

### PASO 1: Buscar y Reemplazar Colores

Usa Find & Replace (Ctrl+H) en VS Code para reemplazar colores genéricos por colores de marca:

#### 🔴 AZUL → ROJO (Acciones Principales)

| **Buscar** | **Reemplazar** | **Uso** |
|------------|---------------|---------|
| `bg-blue-600` | `bg-brand-red-600` | Botones principales CTA |
| `bg-blue-700` | `bg-brand-red-700` | Hover de botones |
| `bg-blue-500` | `bg-brand-red-500` | Variantes de acción |
| `hover:bg-blue-700` | `hover:bg-brand-red-700` | Estados hover |
| `text-blue-600` | `text-brand-red-600` | Enlaces/texto de acción |
| `text-blue-700` | `text-brand-red-700` | Texto hover |
| `border-blue-500` | `border-brand-red-500` | Bordes de acción |
| `ring-blue-500` | `ring-brand-red-500` | Focus rings |
| `focus:ring-blue-500` | `focus:ring-brand-red-500` | Focus states |
| `focus:border-blue-500` | `focus:ring-brand-red-500` | Border focus |

#### ⚫ SLATE → PLOMO (Navegación y Estructura)

| **Buscar** | **Reemplazar** | **Uso** |
|------------|---------------|---------|
| `bg-slate-900` | `bg-brand-slate-900` | Fondos oscuros principales |
| `bg-slate-800` | `bg-brand-slate-800` | Fondos oscuros secundarios |
| `bg-slate-700` | `bg-brand-slate-700` | Fondos intermedios |
| `border-slate-700` | `border-brand-slate-700` | Bordes oscuros |

#### ⚪ GRIS (Mantener como está la mayoría)

El gris neutro ya está bien aplicado en la mayoría de casos.

---

### PASO 2: Actualizar Gradientes

#### Buscar gradientes azules y reemplazar:

```tsx
// ANTES
className="bg-gradient-to-r from-blue-600 to-purple-600"

// DESPUÉS - Opción 1: Gradiente de marca
className="bg-gradient-brand"

// DESPUÉS - Opción 2: Gradiente custom
className="bg-gradient-to-r from-brand-red-600 to-brand-red-700"
```

**Buscar y Reemplazar:**
```
Buscar: from-blue-600 to-(?:purple|indigo|blue)-\d{3}
Reemplazar: bg-gradient-brand
```

---

### PASO 3: Actualizar Componentes Específicos

#### 🏠 Header y Navbar

**Archivo:** `src/components/common/Header.tsx` y `Navbar.tsx`

```tsx
// Buscar el fondo de navegación
"bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900"

// Reemplazar por
"bg-gradient-header"
```

#### 🛒 ProductCard

**Archivo:** `src/components/product/ProductCard.tsx`

```tsx
// Botón "Agregar al Carrito"
// ANTES
className="bg-gradient-to-r from-blue-600 to-indigo-600"

// DESPUÉS
className="bg-gradient-brand hover:shadow-brand-red transition-all"
```

#### 📦 Botones de Acción

En todos los componentes, buscar botones principales:

```tsx
// ANTES
<button className="bg-blue-600 hover:bg-blue-700">

// DESPUÉS
<button className="bg-brand-red-600 hover:bg-brand-red-700 hover:shadow-brand-red transition-all">
```

---

### PASO 4: Badges y Notificaciones

#### Badges de Oferta/Nuevo

```tsx
// ANTES
<span className="bg-red-500 text-white">OFERTA</span>

// DESPUÉS
<span className="bg-gradient-brand text-white shadow-brand-red">OFERTA</span>
```

#### Contadores (Carrito, Wishlist)

```tsx
// ANTES
<span className="bg-red-500 text-white">3</span>

// DESPUÉS
<span className="bg-brand-red-600 text-white shadow-brand-red">3</span>
```

---

### PASO 5: Elementos Interactivos

#### Links

```tsx
// ANTES
<Link className="text-blue-600 hover:text-blue-800">

// DESPUÉS
<Link className="link-brand">
// O
<Link className="text-brand-red-600 hover:text-brand-red-700">
```

#### Inputs con Focus

```tsx
// ANTES
focus:ring-blue-500 focus:border-blue-500

// DESPUÉS
focus:ring-brand-red-500 focus:border-brand-red-500
```

#### Checkboxes y Radios

```tsx
// ANTES
className="text-blue-600 focus:ring-blue-500"

// DESPUÉS
className="text-brand-red-600 focus:ring-brand-red-500"
```

---

## 📂 Archivos Prioritarios a Actualizar

### 🔥 Alta Prioridad (Visible al usuario)

1. ✅ **ProductFilters.tsx** - YA ACTUALIZADO
2. **ProductCard.tsx** - Botones principales
3. **Navbar.tsx** - Navegación principal
4. **Header.tsx** - Encabezado
5. **Footer.tsx** - Pie de página
6. **CartIcon.tsx** - Icono de carrito
7. **ProductDetail.tsx** - Página de producto

### 📦 Media Prioridad

8. **Carousel.tsx** - Carrusel principal
9. **PromoModal.tsx** - Modal de promociones
10. **SearchBar.tsx** - Barra de búsqueda
11. **Pagination.tsx** - Paginación

### 🛠️ Baja Prioridad (Admin)

12. **Admin/Sidebar.tsx**
13. **Admin/PageHeader.tsx**
14. **Admin/StatsCard.tsx**

---

## 🔍 Buscar Patrones Específicos

### En VS Code, usa estas búsquedas regex:

#### 1. Encontrar todos los botones con bg-blue
```regex
className="[^"]*bg-blue-\d{3}[^"]*"
```

#### 2. Encontrar todos los gradientes azules
```regex
className="[^"]*gradient[^"]*blue[^"]*"
```

#### 3. Encontrar todos los focus rings azules
```regex
focus:ring-blue-\d{3}
```

#### 4. Encontrar todos los text-blue
```regex
text-blue-\d{3}
```

---

## ✨ Mejoras Adicionales Recomendadas

### 1. Agregar animaciones a botones principales

```tsx
// ANTES
<button className="bg-brand-red-600 hover:bg-brand-red-700">

// DESPUÉS (Mejor UX)
<button className="bg-brand-red-600 hover:bg-brand-red-700 hover:-translate-y-1 active:scale-95 hover:shadow-brand-red transition-all">
```

### 2. Agregar pulse a badges de oferta

```tsx
<span className="bg-gradient-brand animate-pulse shadow-brand-red">
  ¡OFERTA!
</span>
```

### 3. Mejorar contraste en modo oscuro

```tsx
className="text-brand-black-800 dark:text-white"
className="bg-white dark:bg-brand-slate-900"
className="border-brand-gray-200 dark:border-brand-slate-700"
```

---

## 🧪 Testing

Después de aplicar los cambios, verifica:

1. ✅ **Contraste de texto** - Debe ser legible
2. ✅ **Estados hover** - Deben verse diferenciados
3. ✅ **Estados focus** - Deben tener el anillo rojo
4. ✅ **Modo oscuro** - Debe mantener buena visibilidad
5. ✅ **Botones deshabilitados** - No deben usar rojo

---

## 🎨 Antes y Después

### Botón Principal

```tsx
// ❌ ANTES (Genérico sin identidad)
<button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded">
  Comprar
</button>

// ✅ DESPUÉS (Con identidad de marca)
<button className="bg-brand-red-600 hover:bg-brand-red-700 hover:shadow-brand-red active:scale-95 text-white px-6 py-3 rounded-lg transition-all duration-300">
  Comprar Ahora
</button>
```

### Navbar

```tsx
// ❌ ANTES
<nav className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900">

// ✅ DESPUÉS
<nav className="bg-gradient-header">
```

### Badge de Oferta

```tsx
// ❌ ANTES
<span className="bg-red-500 text-white px-2 py-1 rounded">
  OFERTA
</span>

// ✅ DESPUÉS
<span className="bg-gradient-brand text-white px-3 py-1 rounded-full font-bold shadow-brand-red animate-pulse">
  ¡OFERTA!
</span>
```

---

## 🚀 Script de Migración Automático

Si quieres automatizar la migración, puedes usar este script Node.js:

```javascript
// migrate-colors.js
const fs = require('fs');
const path = require('path');

const colorMap = {
  'bg-blue-600': 'bg-brand-red-600',
  'bg-blue-700': 'bg-brand-red-700',
  'bg-blue-500': 'bg-brand-red-500',
  'hover:bg-blue-700': 'hover:bg-brand-red-700',
  'text-blue-600': 'text-brand-red-600',
  'text-blue-700': 'text-brand-red-700',
  'border-blue-500': 'border-brand-red-500',
  'ring-blue-500': 'ring-brand-red-500',
  'focus:ring-blue-500': 'focus:ring-brand-red-500',
  'focus:border-blue-500': 'focus:border-brand-red-500',
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  Object.entries(colorMap).forEach(([oldColor, newColor]) => {
    if (content.includes(oldColor)) {
      content = content.replaceAll(oldColor, newColor);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Usar: node migrate-colors.js
// O mejor: hacer find & replace manual para tener control
```

---

## ⚠️ IMPORTANTE: No Cambiar

**NO** cambies estos colores porque son funcionales:

- ✅ `bg-green-*` - Verde para éxito/disponibilidad
- ✅ `bg-yellow-*` - Amarillo para advertencias
- ✅ `bg-red-*` en errores - Ya es correcto
- ✅ Grises en texto secundario - Mantener neutralidad

---

## 🎯 Checklist Final

- [ ] Actualizar Header.tsx
- [ ] Actualizar Navbar.tsx
- [ ] Actualizar ProductCard.tsx
- [ ] Actualizar ProductFilters.tsx ✅
- [ ] Actualizar Footer.tsx
- [ ] Actualizar Buttons globales
- [ ] Actualizar Links
- [ ] Actualizar Inputs con focus
- [ ] Actualizar Badges
- [ ] Probar en modo claro
- [ ] Probar en modo oscuro
- [ ] Verificar contraste
- [ ] Verificar accesibilidad

---

**¡Listo!** Con estos pasos tendrás todo el proyecto usando los colores corporativos de **Peruana Informática**.

¿Necesitas ayuda con algún componente específico? 🚀
