import { GoogleGenerativeAI } from "@google/generative-ai";

interface TitleSuggestion {
  title: string;
  topic: string;
  description?: string;
}

interface BlogContent {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  meta_title: string;
  meta_description: string;
  reading_time: number;
  word_count: number;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private isConfigured: boolean = false;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ GEMINI_API_KEY not configured. AI features will be disabled.",
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Usar gemini-2.5-flash - modelo más reciente
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      this.isConfigured = true;
      console.log("🤖 Google Gemini service initialized successfully (FREE!)");
      console.log("📋 Using model: gemini-2.5-flash");
    } catch (error) {
      console.error("❌ Error initializing Gemini:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Verificar si Gemini está configurado
   */
  public isReady(): boolean {
    return this.isConfigured && this.model !== null;
  }

  /**
   * Verificar si la API Key es válida haciendo una llamada de prueba
   */
  public async verifyApiKey(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const prompt = "Responde con 'OK' si estás funcionando correctamente.";
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Si obtenemos una respuesta, la API Key es válida
      return text !== undefined && text !== null;
    } catch (error) {
      console.error("❌ Error verifying API Key:", error);
      return false;
    }
  }

  /**
   * Generar títulos para blog posts sobre tecnología
   */
  async generateBlogTitles(
    topic: string = "tecnología",
    count: number = 5,
  ): Promise<TitleSuggestion[]> {
    if (!this.isReady()) {
      throw new Error(
        "Gemini service not configured. Please set GEMINI_API_KEY",
      );
    }

    try {
      console.log(`🤖 Generating ${count} blog titles for topic: ${topic}`);

      const prompt = `Como experto en marketing de contenidos y tecnología, genera ${count} títulos atractivos para blog posts sobre ${topic}.

Contexto: El blog es de "Peruana Informática", una tienda de equipos tecnológicos en Perú que busca educar y atraer clientes potenciales.

Requisitos:
- Títulos llamativos y SEO-friendly
- Relevantes para el mercado peruano
- Orientados a generar interés en productos tecnológicos
- Entre 40-60 caracteres
- Que generen curiosidad y engagement
- Actuales y trending en tecnología

Devuelve SOLO un JSON válido con este formato (sin texto adicional):
[
  {
    "title": "Título del post",
    "topic": "categoría específica",
    "description": "breve descripción del enfoque del post"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Limpiar el texto para obtener solo el JSON
      let jsonText = text.trim();

      // Remover bloques de código markdown si existen
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      const suggestions: TitleSuggestion[] = JSON.parse(jsonText);

      console.log(`✅ Generated ${suggestions.length} title suggestions`);
      return suggestions;
    } catch (error: any) {
      console.error("❌ Error generating titles with Gemini:", error);
      throw new Error(
        `Failed to generate titles: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generar contenido completo para un blog post
   */
  async generateBlogContent(
    title: string,
    topic: string = "tecnología",
  ): Promise<BlogContent> {
    if (!this.isReady()) {
      throw new Error(
        "Gemini service not configured. Please set GEMINI_API_KEY",
      );
    }

    try {
      console.log(`🤖 Generating blog content for: ${title}`);

      // Paso 1: Generar el contenido del artículo (sin JSON)
      const contentPrompt = `Como redactor experto en tecnología, escribe un artículo completo y profesional para el blog de "Peruana Informática".

TÍTULO: ${title}
TEMA: ${topic}

REQUISITOS:
- Contenido extenso: mínimo 1500 palabras
- Formato Markdown profesional
- Estructura clara con encabezados (##, ###)
- Información útil para el mercado peruano
- Tono profesional pero accesible
- Incluye ejemplos prácticos

ESTRUCTURA:
1. Introducción
2. Desarrollo con subtemas
3. Consejos prácticos
4. Conclusión

Escribe SOLO el artículo en Markdown, sin explicaciones adicionales.`;

      const contentResult = await this.model.generateContent(contentPrompt);
      const contentResponse = await contentResult.response;
      let articleContent = contentResponse.text().trim();

      // Limpiar bloques de código markdown si envuelven todo el contenido
      if (articleContent.startsWith("```markdown")) {
        articleContent = articleContent.replace(/```markdown\n?/g, "").replace(/```$/g, "");
      } else if (articleContent.startsWith("```")) {
        articleContent = articleContent.replace(/```\n?/g, "");
      }

      // Paso 2: Generar metadatos simples
      const metaPrompt = `Para el siguiente título de artículo, genera metadatos SEO.
Título: "${title}"
Tema: ${topic}

Responde EXACTAMENTE en este formato (una línea por campo):
EXCERPT: [extracto de 150 caracteres]
TAGS: tag1, tag2, tag3, tag4, tag5
META_TITLE: [título SEO de 60 caracteres]
META_DESC: [descripción SEO de 150 caracteres]`;

      const metaResult = await this.model.generateContent(metaPrompt);
      const metaResponse = await metaResult.response;
      const metaText = metaResponse.text();

      // Parsear metadatos línea por línea
      const excerptMatch = metaText.match(/EXCERPT:\s*(.+)/i);
      const tagsMatch = metaText.match(/TAGS:\s*(.+)/i);
      const metaTitleMatch = metaText.match(/META_TITLE:\s*(.+)/i);
      const metaDescMatch = metaText.match(/META_DESC:\s*(.+)/i);

      const excerpt = excerptMatch ? excerptMatch[1].trim() : articleContent.substring(0, 150);
      const tags = tagsMatch ? tagsMatch[1].split(',').map((t: string) => t.trim()) : [topic];
      const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : title;
      const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : excerpt;

      // Calcular estadísticas
      const wordCount = articleContent.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      console.log(`✅ Generated blog content: ${wordCount} words, ~${readingTime} min read`);

      return {
        title: title,
        content: articleContent,
        excerpt: excerpt,
        tags: tags,
        categories: [topic],
        meta_title: metaTitle,
        meta_description: metaDesc,
        reading_time: readingTime,
        word_count: wordCount,
      };
    } catch (error: any) {
      console.error("❌ Error generating blog content with Gemini:", error);
      throw new Error(
        `Failed to generate content: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generar prompt para imagen basado en el título y contenido
   */
  async generateImagePrompt(title: string, content?: string): Promise<string> {
    try {
      if (!this.isReady()) {
        throw new Error("Gemini service not initialized");
      }

      const prompt = `Based on this blog title: "${title}"
      ${content ? `And this content snippet: "${content.substring(0, 300)}"` : ""}
      
      Generate a detailed, descriptive prompt (max 200 characters) for an AI image generator to create a relevant, professional, and visually appealing featured image for this article.
      
      Style: Modern, Tech-focused, High quality, 4k, Cinematic lighting.
      No text in the image.
      
      Return ONLY the prompt in English.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error("❌ Error generating image prompt:", error);
      return `Modern technology concept related to ${title}, high quality, 4k, cinematic lighting`;
    }
  }

  /**
   * Generar imagen usando Pollinations.ai (Free AI Image Generator)
   */
  async generateBlogImage(title: string, content?: string): Promise<string> {
    try {
      console.log("🎨 Generating AI image prompt...");
      const imagePrompt = await this.generateImagePrompt(title, content);
      console.log("📝 Image Prompt:", imagePrompt);

      // Encode prompt for URL
      const encodedPrompt = encodeURIComponent(imagePrompt);

      // Pollinations AI URL (No API Key required, Free)
      // Agregamos seed aleatorio para evitar caché si se regenera
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}&model=flux`;

      console.log("✅ Generated Pollinations Image URL");
      return imageUrl;

    } catch (error) {
      console.error("❌ Error generating blog image:", error);
      // Fallback
      return `https://picsum.photos/seed/${encodeURIComponent(title)}/1280/720`;
    }
  }

  // Método antiguo - mantener por compatibilidad
  async generateBlogImageOld(title: string): Promise<string> {
    try {
      // Extraer palabras clave del título para la búsqueda de imagen
      const keywords = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(" ")
        .slice(0, 3)
        .join(",");

      // Usar Unsplash para imágenes gratuitas de alta calidad
      const imageUrl = `https://source.unsplash.com/800x400/?${keywords},technology`;

      console.log(`✅ Generated image URL for: ${title}`);
      return imageUrl;
    } catch (error) {
      console.warn("⚠️ Could not generate image, using placeholder");
      return "https://via.placeholder.com/800x400/667eea/ffffff?text=Tech+Blog";
    }
  }

  /**
   * Generar tags relevantes para un contenido
   */
  async generateTags(content: string, count: number = 5): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error(
        "Gemini service not configured. Please set GEMINI_API_KEY",
      );
    }

    try {
      const prompt = `Analiza el siguiente contenido y genera ${count} tags/etiquetas relevantes en español.
Los tags deben ser:
- Palabras clave específicas
- Relevantes para SEO
- Entre 1-3 palabras cada uno
- En minúsculas
- Sin caracteres especiales

Contenido:
${content.substring(0, 1000)}...

Devuelve SOLO un array JSON (sin texto adicional):
["tag1", "tag2", "tag3", "tag4", "tag5"]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Limpiar el texto
      let jsonText = text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      const tags: string[] = JSON.parse(jsonText);
      return tags.slice(0, count);
    } catch (error: any) {
      console.error("❌ Error generating tags with Gemini:", error);
      // Retornar tags por defecto en caso de error
      return ["tecnología", "informática", "productos", "guía", "review"];
    }
  }

  /**
   * Mejorar contenido existente
   */
  async improveContent(
    content: string,
    improvements: string[],
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error(
        "Gemini service not configured. Please set GEMINI_API_KEY",
      );
    }

    try {
      const improvementsList = improvements.join(", ");

      const prompt = `Mejora el siguiente contenido aplicando estas mejoras: ${improvementsList}

Contenido original:
${content}

Devuelve el contenido mejorado en formato Markdown, manteniendo la estructura pero mejorando: ${improvementsList}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("❌ Error improving content with Gemini:", error);
      throw new Error(
        `Failed to improve content: ${error.message || "Unknown error"}`,
      );
    }
  }
}

// Instancia singleton
export const geminiService = new GeminiService();

// Exportar clase para testing si es necesario
export { GeminiService };
