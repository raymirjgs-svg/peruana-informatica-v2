# Herramienta de Asignación Masiva de Productos

## 🎯 Propósito

Este script asigna automáticamente **categorías**, **subcategorías** y **atributos** a productos existentes basándose en el análisis de sus nombres y descripciones.

## 🚀 Cómo Usar

### Opción 1: Ejecutar desde terminal

```bash
cd backend
npx ts-node src/scripts/bulkAssignProducts.ts
```

### Opción 2: Integrar en el backend

```typescript
import { bulkAssignProducts } from './scripts/bulkAssignProducts';

// Llamar desde algún endpoint admin
await bulkAssignProducts();
```

## 📋 Qué Hace el Script

1. **Busca productos sin categoría** en la base de datos
2. **Analiza nombres y descripciones** buscando palabras clave
3. **Asigna automáticamente:**
   - Categoría (ej: "Componentes PC", "Laptops", "Periféricos")
   - Subcategoría (ej: "Procesadores", "Placas Madre", "Memorias RAM")
   - `component_type` (para compatibilidad del PC Builder)
   - Atributos dinámicos (Socket, Tipo RAM, Marca, etc.)

## 🔍 Palabras Clave Detectadas

### Procesadores (CPUs)
- **Keywords:** procesador, processor, cpu, ryzen, intel core, i3, i5, i7, i9
- **Categoría:** Componentes PC > Procesadores
- **Atributos detectados:**
  - Marca: AMD (si contiene "ryzen" o "amd") / Intel (si contiene "intel" o "core i")
  - Socket: AM4, AM5, LGA1700, LGA1200

### Placas Madre
- **Keywords:** motherboard, placa madre, mainboard, tarjeta madre
- **Categoría:** Componentes PC > Placas Madre
- **Atributos detectados:**
  - Plataforma: AMD / Intel
  - Socket: AM4, AM5, LGA1700, LGA1200
  - Tipo RAM: DDR4 / DDR5

### Memorias RAM
- **Keywords:** memoria ram, ram, ddr4, ddr5
- **Categoría:** Componentes PC > Memorias RAM
- **Atributos detectados:**
  - Tipo: DDR4 / DDR5
  - Capacidad: Extrae números seguidos de "GB" (ej: "16GB" → 16)

### Tarjetas Gráficas
- **Keywords:** tarjeta grafica, gpu, video card, geforce, radeon, rtx, gtx
- **Categoría:** Componentes PC > Tarjetas Gráficas

### Almacenamiento
- **Keywords:** disco duro, ssd, nvme, hard drive, hdd
- **Categoría:** Componentes PC > Almacenamiento

### Fuentes de Poder
- **Keywords:** fuente de poder, power supply, psu
- **Categoría:** Componentes PC > Fuentes de Poder

### Laptops
- **Keywords:** laptop, notebook, portátil, portatil
- **Categoría:** Laptops > Laptops Gaming

### Periféricos
- **Monitores:** monitor, pantalla, display
- **Teclados:** teclado, keyboard
- **Mouse:** mouse, ratón, raton

## 📊 Ejemplo de Salida

```
🚀 Iniciando asignación masiva de productos...

📦 Productos sin categoría: 150

✅ ASIGNADO: Procesador AMD Ryzen 5 5600X → Componentes PC > Procesadores
   └─ Atributos: brand=amd, socket=am4
✅ ASIGNADO: Placa Madre ASUS TUF B550 → Componentes PC > Placas Madre
   └─ Atributos: platform=amd, socket=am4, ram_type=ddr4
✅ ASIGNADO: Memoria RAM Corsair Vengeance 16GB DDR4 → Componentes PC > Memorias RAM
   └─ Atributos: type=ddr4, capacity=16
⏭️  SKIP: Producto sin palabras clave reconocidas

📊 Resumen:
   ✅ Asignados: 142
   ⏭️  Omitidos: 8
   📦 Total: 150
```

## ⚙️ Personalizar Reglas

Para añadir más reglas de asignación, edita el archivo `bulkAssign Products.ts`:

```typescript
const assignmentRules: AssignmentRule[] = [
    {
        keywords: ['tu', 'palabra', 'clave'],
        category: 'Tu Categoría',
        subCategory: 'Tu Subcategoría',
        componentType: 'tu_tipo',
        attributes: {
            tu_atributo: 'detectar'
        }
    },
    // ... más reglas
];
```

## 🛡️ Seguridad

- ✅ Solo asigna productos **SIN categoría** (no sobrescribe)
- ✅ Usa `findOrCreate` para evitar duplicados
- ✅ Validación de atributos antes de asignar
- ✅ Log detallado de cada operación

## 🔄 Re-ejecutar

Puedes ejecutar el script múltiples veces de forma segura. Solo procesará productos que aún no tengan categoría asignada.

---

**💡 Tip:** Revisa los productos "SKIP" en la salida y ajusta las palabras clave para mejorar la detección.
