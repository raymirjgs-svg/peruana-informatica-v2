# 🤖 Inteligencia Artificial con Gemini

## Descripción

El sistema usa Google Gemini para generar contenido automático para el blog, incluyendo títulos, artículos completos y metadatos SEO.

---

## ⚙️ Configuración

### Obtener API Key

1. Ve a: https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Copia la key generada

### Variables de entorno

En `backend/.env`:

```env
GEMINI_API_KEY=AIzaSy...tu-api-key
```

### Modelos disponibles

| Modelo | Descripción | Uso recomendado |
|--------|-------------|-----------------|
| gemini-2.5-flash | Más reciente y rápido | Producción |
| gemini-2.0-flash | Estable | Alternativa |
| gemini-pro | Modelo base | Fallback |

---

## 📁 Estructura del Código

### GeminiService

**Archivo:** `backend/src/services/GeminiService.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
  }

  async generateBlogTitles(topic: string): Promise<TitleSuggestion[]> { ... }
  async generateBlogContent(title: string, topic: string): Promise<BlogContent> { ... }
  async generateImageKeywords(title: string): Promise<string> { ... }
}
```

---

## ✨ Funcionalidades

### 1. Generar Títulos

Genera 5-10 sugerencias de títulos para artículos de blog.

**Endpoint:**
```http
POST /api/admin/blog/ai/generate-titles
```

**Body:**
```json
{
  "topic": "laptops gaming"
}
```

**Respuesta:**
```json
{
  "titles": [
    {
      "title": "Las 10 Mejores Laptops Gaming del 2025",
      "topic": "laptops",
      "description": "Comparativa de las mejores opciones"
    },
    {
      "title": "Guía de Compra: Laptop Gaming para Principiantes",
      "topic": "guías",
      "description": "Todo lo que necesitas saber"
    }
  ]
}
```

### 2. Generar Contenido Completo

Genera un artículo completo en formato Markdown.

**Endpoint:**
```http
POST /api/admin/blog/ai/generate-content
```

**Body:**
```json
{
  "title": "Las 10 Mejores Laptops Gaming del 2025",
  "topic": "laptops"
}
```

**Respuesta:**
```json
{
  "content": "## Introducción\n\nEn el mundo del gaming...",
  "excerpt": "Descubre las mejores laptops gaming...",
  "tags": ["laptops", "gaming", "tecnología"],
  "categories": ["Laptops"],
  "meta_title": "Mejores Laptops Gaming 2025 | Guía Completa",
  "meta_description": "Comparativa de las 10 mejores laptops...",
  "reading_time": 8,
  "word_count": 1500
}
```

### 3. Generar Keywords para Imágenes

Genera palabras clave para buscar imágenes relacionadas.

```typescript
const keywords = await geminiService.generateImageKeywords(
  "Las 10 Mejores Laptops Gaming"
);
// Resultado: "gaming laptop computer rgb keyboard"
```

---

## 🎯 Uso en el Panel Admin

### Flujo de creación de blog con IA

1. **Ir a**: `/admin/blog/new`
2. **Clic en**: "Generar Títulos con IA"
3. **Seleccionar** un título sugerido
4. **Clic en**: "Generar Contenido"
5. **Revisar y editar** el contenido generado
6. **Publicar** el artículo

### Interfaz

```
┌─────────────────────────────────────────┐
│  📝 Nuevo Artículo de Blog              │
├─────────────────────────────────────────┤
│  Tema: [________________] [🤖 Generar]  │
│                                          │
│  Sugerencias de títulos:                 │
│  ○ Las 10 Mejores Laptops Gaming...     │
│  ○ Guía de Compra: Laptop Gaming...     │
│  ○ Laptops Gaming vs Laptops Trabajo... │
│                                          │
│  [Usar título seleccionado]              │
├─────────────────────────────────────────┤
│  Título: [Las 10 Mejores Laptops...]    │
│                                          │
│  [🤖 Generar Contenido]                  │
│                                          │
│  Contenido:                              │
│  ┌─────────────────────────────────────┐│
│  │ ## Introducción                     ││
│  │ En el mundo del gaming...           ││
│  │ ...                                 ││
│  └─────────────────────────────────────┘│
│                                          │
│  [Guardar Borrador] [Publicar]          │
└─────────────────────────────────────────┘
```

---

## 📊 Límites y Costos

### Capa Gratuita de Gemini

| Límite | Valor |
|--------|-------|
| Requests por minuto | 15 |
| Requests por día | 1,500 |
| Tokens por minuto | 1,000,000 |

### Recomendaciones

- No hacer más de 10-15 generaciones por hora
- Cachear respuestas cuando sea posible
- Implementar rate limiting en el frontend

---

## 🔧 Configuración Avanzada

### Parámetros del modelo

```typescript
this.model = this.genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,      // Creatividad (0-1)
    topP: 0.95,            // Diversidad
    topK: 40,              // Vocabulario
    maxOutputTokens: 8192, // Longitud máxima
  },
});
```

### Ajustar temperatura

| Valor | Resultado |
|-------|-----------|
| 0.1-0.3 | Más preciso, menos creativo |
| 0.4-0.6 | Balance |
| 0.7-0.9 | Más creativo, menos predecible |

---

## 🐛 Solución de Problemas

### Error: API key not valid
- Verificar que la API key esté en `.env`
- Verificar que no tenga espacios extra
- Generar una nueva key si es necesario

### Error: Quota exceeded (limit: 0)
- La cuenta tiene restricciones
- Esperar 24 horas
- Usar otra cuenta de Google
- Habilitar facturación en Google Cloud

### Error: Model not found
- Verificar nombre del modelo
- Usar modelos disponibles: gemini-2.5-flash, gemini-2.0-flash

### Error: JSON parse error
- El modelo puede generar JSON mal formado
- El servicio intenta recuperar automáticamente
- Si persiste, reintentar la generación

---

## 💡 Mejores Prácticas

1. **Revisar siempre** el contenido generado antes de publicar
2. **Editar y personalizar** para darle un toque único
3. **Verificar datos** que el modelo pueda haber inventado
4. **Actualizar precios** si el contenido los menciona
5. **Agregar enlaces** a productos de la tienda
