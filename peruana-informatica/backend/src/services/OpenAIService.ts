import OpenAI from "openai";

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

interface ImageGenerationRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

class OpenAIService {
  private client!: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ OPENAI_API_KEY not configured. AI features will be disabled.",
      );
      this.isConfigured = false;
      return;
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.isConfigured = true;
    console.log("🤖 OpenAI service initialized successfully");
  }

  /**
   * Verificar si OpenAI está configurado
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Generar títulos para blog posts sobre tecnología
   */
  async generateBlogTitles(
    topic: string = "tecnología",
    count: number = 5,
    model: string = "gpt-4o-mini",
  ): Promise<TitleSuggestion[]> {
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI service not configured. Please set OPENAI_API_KEY",
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

Devuelve SOLO un JSON válido con este formato:
[
  {
    "title": "Título del post",
    "topic": "categoría específica",
    "description": "breve descripción del enfoque del post"
  }
]

No incluyas texto adicional, solo el JSON.`;

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en marketing de contenidos y tecnología. Respondes únicamente con JSON válido, sin texto adicional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      let suggestions: TitleSuggestion[];
      try {
        const parsed = JSON.parse(response);
        suggestions = Array.isArray(parsed)
          ? parsed
          : parsed.titles || parsed.suggestions || [];
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", response);
        throw new Error("Invalid JSON response from OpenAI");
      }

      console.log(`✅ Generated ${suggestions.length} title suggestions`);
      return suggestions.slice(0, count); // Asegurar que no excedan el límite
    } catch (error: any) {
      console.error("❌ Error generating blog titles:", error);
      throw new Error(`Failed to generate blog titles: ${error.message}`);
    }
  }

  /**
   * Generar contenido completo de blog post
   */
  async generateBlogContent(
    title: string,
    topic: string = "tecnología",
    model: string = "gpt-4o-mini",
  ): Promise<BlogContent> {
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI service not configured. Please set OPENAI_API_KEY",
      );
    }

    try {
      console.log(`🤖 Generating blog content for: ${title}`);

      const prompt = `Como experto redactor de tecnología, escribe un artículo completo de blog para "Peruana Informática".

Título: "${title}"
Tema: ${topic}

Contexto: Peruana Informática es una tienda líder de equipos tecnológicos en Perú. El blog busca educar a los clientes y posicionarse como expertos en tecnología.

Requisitos del artículo:
- 800-1500 palabras
- Formato en Markdown
- Estructura clara con headers (##, ###)
- Información actualizada y precisa
- Tono profesional pero accesible
- Incluir ejemplos prácticos
- Mencionar productos relevantes (laptops, monitores, etc.)
- Orientado al mercado peruano
- SEO optimizado
- Incluir llamadas a la acción sutiles

Devuelve SOLO un JSON válido con este formato:
{
  "content": "Contenido completo en markdown",
  "excerpt": "Resumen de 150-160 caracteres",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "categories": ["categoria1", "categoria2"],
  "meta_title": "Título SEO optimizado",
  "meta_description": "Meta descripción de 150-160 caracteres"
}

No incluyas texto adicional, solo el JSON.`;

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "Eres un experto redactor de contenido tecnológico. Respondes únicamente con JSON válido, sin texto adicional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      let blogData: any;
      try {
        blogData = JSON.parse(response);
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", response);
        throw new Error("Invalid JSON response from OpenAI");
      }

      // Calcular métricas
      const content = blogData.content || "";
      const wordCount = content
        .split(/\s+/)
        .filter((word: string) => word.length > 0).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 palabras por minuto

      const result: BlogContent = {
        title: title,
        content: content,
        excerpt: blogData.excerpt || this.generateExcerpt(content),
        tags: Array.isArray(blogData.tags) ? blogData.tags : [],
        categories: Array.isArray(blogData.categories)
          ? blogData.categories
          : [],
        meta_title:
          blogData.meta_title || `${title} | Blog Peruana Informática`,
        meta_description: blogData.meta_description || blogData.excerpt || "",
        reading_time: readingTime,
        word_count: wordCount,
      };

      console.log(
        `✅ Generated blog content: ${wordCount} words, ${readingTime} min read`,
      );
      return result;
    } catch (error: any) {
      console.error("❌ Error generating blog content:", error);
      throw new Error(`Failed to generate blog content: ${error.message}`);
    }
  }

  /**
   * Generar imagen para blog post usando DALL-E
   */
  async generateBlogImage(
    title: string,
    content: string,
    options: Partial<ImageGenerationRequest> = {},
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI service not configured. Please set OPENAI_API_KEY",
      );
    }

    try {
      console.log(`🎨 Generating image for blog post: ${title}`);

      // Crear un prompt para la imagen basado en el título y contenido
      const imagePrompt = await this.generateImagePrompt(title, content);

      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        size: options.size || "1792x1024",
        quality: options.quality || "hd",
        style: options.style || "natural",
        n: 1,
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      console.log("✅ Generated blog image successfully");
      return imageUrl;
    } catch (error: any) {
      console.error("❌ Error generating blog image:", error);
      throw new Error(`Failed to generate blog image: ${error.message}`);
    }
  }

  /**
   * Generar prompt optimizado para imagen
   */
  private async generateImagePrompt(
    title: string,
    content: string,
  ): Promise<string> {
    try {
      const prompt = `Basándote en este título de blog: "${title}" y el siguiente contenido (primeros 500 caracteres):

"${content.substring(0, 500)}..."

Crea un prompt detallado en inglés para generar una imagen profesional para este artículo de blog de tecnología.

Requisitos:
- Imagen profesional y moderna
- Relacionada con tecnología
- Sin texto en la imagen
- Estilo corporativo pero atractivo
- Alta calidad visual
- Colores profesionales

Responde solo con el prompt en inglés, máximo 400 caracteres.`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const generatedPrompt = completion.choices[0]?.message?.content?.trim();

      if (!generatedPrompt) {
        // Fallback prompt
        return `Professional technology blog header image, modern tech equipment, clean corporate style, high-tech atmosphere, professional lighting, no text`;
      }

      return generatedPrompt;
    } catch (error) {
      console.warn("Error generating image prompt, using fallback");
      return `Professional technology blog header image, modern tech equipment, clean corporate style, high-tech atmosphere, professional lighting, no text`;
    }
  }

  /**
   * Mejorar contenido existente
   */
  async improveBlogContent(
    content: string,
    instructions: string = "Mejorar SEO y legibilidad",
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI service not configured. Please set OPENAI_API_KEY",
      );
    }

    try {
      const prompt = `Mejora el siguiente contenido de blog siguiendo estas instrucciones: "${instructions}"

Contenido original:
${content}

Devuelve el contenido mejorado manteniendo el formato markdown y la estructura original.`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto editor de contenido tecnológico. Mejoras contenido manteniendo la estructura y formato original.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      });

      const improvedContent = completion.choices[0]?.message?.content;
      if (!improvedContent) {
        throw new Error("No response from OpenAI");
      }

      return improvedContent;
    } catch (error: any) {
      console.error("❌ Error improving blog content:", error);
      throw new Error(`Failed to improve blog content: ${error.message}`);
    }
  }

  /**
   * Generar extracto desde contenido
   */
  private generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(" ");

    if (lastSpaceIndex > maxLength - 20) {
      return truncated.substring(0, lastSpaceIndex) + "...";
    }

    return truncated + "...";
  }

  /**
   * Obtener información de uso (tokens)
   */
  async getUsageInfo(): Promise<any> {
    // OpenAI no proporciona información de uso directamente desde el SDK
    // Esto requeriría una llamada separada a la API de uso
    console.log(
      "ℹ️ Usage info requires separate API call to OpenAI usage endpoint",
    );
    return null;
  }

  /**
   * Generar tags relevantes desde contenido
   */
  async generateTags(content: string, maxTags: number = 8): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI service not configured. Please set OPENAI_API_KEY",
      );
    }

    try {
      const prompt = `Analiza el siguiente contenido de blog sobre tecnología y genera ${maxTags} tags relevantes en español:

${content.substring(0, 1000)}...

Devuelve solo un array JSON con los tags, sin texto adicional:
["tag1", "tag2", "tag3"]`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed.tags) ? parsed.tags.slice(0, maxTags) : [];
      } catch (parseError) {
        return [];
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      return [];
    }
  }
}

// Singleton instance
export const openaiService = new OpenAIService();
export {
  OpenAIService,
  type TitleSuggestion,
  type BlogContent,
  type ImageGenerationRequest,
};
