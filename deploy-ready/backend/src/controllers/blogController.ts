import { Request, Response } from "express";
import { BlogPost } from "../models/BlogPost";
import { BlogTitleSuggestion } from "../models/BlogTitleSuggestion";
import { geminiService, GeminiService } from "../services/GeminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Op } from "sequelize";
import * as fs from "fs";
import * as path from "path";

export class BlogController {
  // ====================== PUBLIC ROUTES ======================

  // Obtener posts publicados (frontend público)
  static async getPublishedPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const tag = req.query.tag as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;
      const whereClause: any = {
        status: "published",
        // Todos los posts publicados se muestran (sin filtro de fecha/hora)
      };

      // Filtros
      if (category) {
        whereClause.categories = {
          [Op.like]: `%${category}%`,
        };
      }

      if (tag) {
        whereClause.tags = {
          [Op.like]: `%${tag}%`,
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { tags: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await BlogPost.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [
          ["is_featured", "DESC"],
          ["published_at", "DESC"],
        ],
        attributes: {
          exclude: ["ai_prompt"], // No exponer prompts en público
        },
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching published posts:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener los posts del blog",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener post por slug (frontend público)
  static async getPostBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const post = await BlogPost.findOne({
        where: {
          slug,
          status: "published",
          // Sin filtro de fecha - todos los posts publicados son visibles
        },
        attributes: {
          exclude: ["ai_prompt"], // No exponer prompts en público
        },
      });

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "El post solicitado no existe o no está publicado",
          code: "POST_NOT_FOUND",
        });
      }

      // Incrementar vistas
      await post.incrementViews();

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Incrementar likes de un post
  static async likePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post || post.status !== "published") {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "El post solicitado no existe o no está publicado",
          code: "POST_NOT_FOUND",
        });
      }

      await post.incrementLikes();

      res.json({
        success: true,
        message: "Like registrado exitosamente",
        data: { likes: post.likes + 1 },
      });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al procesar el like",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // ====================== ADMIN ROUTES ======================

  // Obtener todos los posts (admin)
  static async getAllPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;
      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
          { author_name: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await BlogPost.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching all posts:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener los posts",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Crear nuevo post
  static async createPost(req: Request, res: Response) {
    try {
      console.log("📝 Creating new blog post");
      console.log("Request body:", req.body);

      const {
        title,
        slug,
        excerpt,
        content,
        featured_image,
        meta_title,
        meta_description,
        meta_keywords,
        author_name,
        author_email,
        status,
        scheduled_at,
        is_featured,
        tags,
        categories,
        ai_generated,
        ai_prompt,
        ai_model,
      } = req.body;

      // Validar datos requeridos
      if (!title || !content) {
        return res.status(400).json({
          error: "Datos incompletos",
          message: "Título y contenido son requeridos",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      // Generar imagen automáticamente si no se proporciona y Gemini está disponible
      let generatedImage = featured_image;
      if (!featured_image && geminiService.isReady()) {
        try {
          console.log("🖼️ Auto-generating image for post:", title);
          generatedImage = await geminiService.generateBlogImage(title, content);
          console.log("✅ Image generated:", generatedImage);
        } catch (error) {
          console.error("❌ Failed to generate image, using fallback");
          generatedImage = `https://source.unsplash.com/1200x600/?technology`;
        }
      }

      const newPost = await BlogPost.create({
        title,
        slug: slug || BlogPost.generateSlug(title),
        excerpt,
        content,
        featured_image: generatedImage,
        meta_title,
        meta_description,
        meta_keywords,
        author_name: author_name || "Peruana Informática",
        author_email,
        status: status || "draft",
        scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
        is_featured: is_featured || false,
        tags,
        categories,
        ai_generated: ai_generated || false,
        ai_prompt,
        ai_model,
      });

      console.log("✅ Blog post created with ID:", newPost.id);

      res.status(201).json({
        success: true,
        message: "Post creado exitosamente",
        data: newPost,
      });
    } catch (error: any) {
      console.error("❌ Error creating blog post:", error);

      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          error: "Datos inválidos",
          message: "Por favor verifica los datos enviados",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        });
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Slug duplicado",
          message: "Ya existe un post con este slug",
          code: "DUPLICATE_SLUG",
        });
      }

      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al crear el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener post por ID (admin)
  static async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Actualizar post
  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`📝 Updating blog post ID: ${id}`);

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      await post.update(req.body);

      console.log("✅ Blog post updated successfully");

      res.json({
        success: true,
        message: "Post actualizado exitosamente",
        data: post,
      });
    } catch (error: any) {
      console.error("❌ Error updating blog post:", error);

      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          error: "Datos inválidos",
          message: "Por favor verifica los datos enviados",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        });
      }

      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al actualizar el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Eliminar post
  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      await post.destroy();

      res.json({
        success: true,
        message: "Post eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al eliminar el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // ====================== AI FEATURES ======================

  // Generar títulos con IA
  static async generateTitles(req: Request, res: Response) {
    try {
      const { topic, count, model } = req.body;

      if (!geminiService.isReady()) {
        return res.status(503).json({
          error: "Servicio no disponible",
          message:
            "Gemini AI no está configurado. Por favor configura GEMINI_API_KEY",
          code: "AI_SERVICE_NOT_CONFIGURED",
        });
      }

      console.log(
        `🤖 Generating ${count || 5} titles for topic: ${topic || "tecnología"}`,
      );

      const suggestions = await geminiService.generateBlogTitles(
        topic || "tecnología",
        count || 5,
      );

      // Guardar sugerencias en la base de datos
      const savedSuggestions = await Promise.all(
        suggestions.map((suggestion) =>
          BlogTitleSuggestion.create({
            suggested_title: suggestion.title,
            topic: suggestion.topic,
            ai_prompt: `Generar títulos para: ${topic || "tecnología"}`,
            ai_model: model || "gemini-2.0-flash-exp",
            status: "pending",
          }),
        ),
      );

      res.json({
        success: true,
        message: `${suggestions.length} títulos generados exitosamente`,
        data: savedSuggestions,
      });
    } catch (error: any) {
      console.error("❌ Error generating titles:", error);
      
      // Manejo específico de errores de la API de Gemini
      if (error.message && error.message.includes("API_KEY")) {
        return res.status(401).json({
          error: "Error de autenticación",
          message: "La API Key de Gemini no es válida o ha expirado. Por favor configura una nueva API Key.",
          code: "AI_AUTHENTICATION_ERROR",
        });
      }
      
      if (error.message && error.message.includes("429")) {
        return res.status(429).json({
          error: "Límite de uso excedido",
          message: "Has alcanzado el límite de solicitudes a la API de Gemini. Por favor espera un momento antes de intentar de nuevo.",
          code: "AI_RATE_LIMIT_EXCEEDED",
        });
      }
      
      res.status(500).json({
        error: "Error generando títulos",
        message: error.message || "Error al generar títulos con IA",
        code: "AI_GENERATION_ERROR",
      });
    }
  }

  // Obtener sugerencias de títulos
  static async getTitleSuggestions(req: Request, res: Response) {
    try {
      const { status, topic } = req.query;
      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      if (topic) {
        whereClause.topic = {
          [Op.iLike]: `%${topic}%`,
        };
      }

      const suggestions = await BlogTitleSuggestion.findAll({
        where: whereClause,
        order: [["generated_at", "DESC"]],
        limit: 50,
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error("Error fetching title suggestions:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener las sugerencias",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Generar contenido completo desde un título
  static async generateContentFromTitle(req: Request, res: Response) {
    try {
      const { title_suggestion_id, model } = req.body;

      if (!geminiService.isReady()) {
        return res.status(503).json({
          error: "Servicio no disponible",
          message: "Gemini AI no está configurado",
          code: "AI_SERVICE_NOT_CONFIGURED",
        });
      }

      // Obtener la sugerencia de título
      const suggestion =
        await BlogTitleSuggestion.findByPk(title_suggestion_id);

      if (!suggestion) {
        return res.status(404).json({
          error: "Sugerencia no encontrada",
          message: "No se encontró la sugerencia de título",
          code: "SUGGESTION_NOT_FOUND",
        });
      }

      if (!suggestion.isAvailable()) {
        return res.status(409).json({
          error: "Sugerencia no disponible",
          message: "Esta sugerencia ya fue usada o rechazada",
          code: "SUGGESTION_NOT_AVAILABLE",
        });
      }

      console.log(`🤖 Generating content for: ${suggestion.suggested_title}`);

      // Generar contenido con IA
      const blogContent = await geminiService.generateBlogContent(
        suggestion.suggested_title,
        suggestion.topic || "tecnología",
      );

      // Generar imagen (gratis con Unsplash) - ahora pasamos también el contenido
      let featuredImage = null;
      try {
        featuredImage = await geminiService.generateBlogImage(
          suggestion.suggested_title,
          blogContent.content // Pasamos el contenido para una mejor generación de keywords
        );
        console.log("✅ Generated featured image URL");
      } catch (imageError) {
        console.warn("⚠️ Could not generate image:", imageError);
      }

      // Crear el post como borrador
      const newPost = await BlogPost.create({
        title: suggestion.suggested_title,
        slug: BlogPost.generateSlug(suggestion.suggested_title),
        excerpt: blogContent.excerpt,
        content: blogContent.content,
        featured_image: featuredImage || undefined,
        meta_title: blogContent.meta_title,
        meta_description: blogContent.meta_description,
        meta_keywords: blogContent.tags.join(", "),
        author_name: "Peruana Informática",
        tags: blogContent.tags.join(", "),
        categories: blogContent.categories.join(", "),
        status: "draft",
        ai_generated: true,
        ai_prompt: `Generar contenido para: ${suggestion.suggested_title}`,
        ai_model: model || "gemini-2.0-flash-exp",
        reading_time: blogContent.reading_time,
        word_count: blogContent.word_count,
      });

      // Marcar la sugerencia como usada
      await suggestion.markAsUsed(newPost.id);

      console.log("✅ AI-generated blog post created:", newPost.id);

      res.status(201).json({
        success: true,
        message: "Contenido generado exitosamente",
        data: {
          post: newPost,
          suggestion: suggestion,
          generated_image: !!featuredImage,
        },
      });
    } catch (error: any) {
      console.error("❌ Error generating content:", error);
      
      // Manejo específico de errores de la API de Gemini
      if (error.message && error.message.includes("API_KEY")) {
        return res.status(401).json({
          error: "Error de autenticación",
          message: "La API Key de Gemini no es válida o ha expirado. Por favor configura una nueva API Key.",
          code: "AI_AUTHENTICATION_ERROR",
        });
      }
      
      if (error.message && error.message.includes("429")) {
        return res.status(429).json({
          error: "Límite de uso excedido",
          message: "Has alcanzado el límite de solicitudes a la API de Gemini. Por favor espera un momento antes de intentar de nuevo.",
          code: "AI_RATE_LIMIT_EXCEEDED",
        });
      }
      
      res.status(500).json({
        error: "Error generando contenido",
        message: error.message || "Error al generar contenido con IA",
        code: "AI_GENERATION_ERROR",
      });
    }
  }

  // Gestionar sugerencia de título (aceptar/rechazar)
  static async manageTitleSuggestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'select' or 'reject'

      const suggestion = await BlogTitleSuggestion.findByPk(id);

      if (!suggestion) {
        return res.status(404).json({
          error: "Sugerencia no encontrada",
          code: "SUGGESTION_NOT_FOUND",
        });
      }

      if (action === "select") {
        await suggestion.markAsSelected();
      } else if (action === "reject") {
        await suggestion.markAsRejected();
      } else {
        return res.status(400).json({
          error: "Acción inválida",
          message: "La acción debe ser 'select' o 'reject'",
          code: "INVALID_ACTION",
        });
      }

      res.json({
        success: true,
        message: `Sugerencia ${action === "select" ? "seleccionada" : "rechazada"} exitosamente`,
        data: suggestion,
      });
    } catch (error) {
      console.error("Error managing title suggestion:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al gestionar la sugerencia",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener estadísticas del blog
  static async getBlogStats(req: Request, res: Response) {
    try {
      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        aiGeneratedPosts,
        totalViews,
        totalLikes,
        pendingSuggestions,
      ] = await Promise.all([
        BlogPost.count(),
        BlogPost.count({ where: { status: "published" } }),
        BlogPost.count({ where: { status: "draft" } }),
        BlogPost.count({ where: { ai_generated: true } }),
        BlogPost.sum("views"),
        BlogPost.sum("likes"),
        BlogTitleSuggestion.count({ where: { status: "pending" } }),
      ]);

      // Posts más populares
      const popularPosts = await BlogPost.findAll({
        where: { status: "published" },
        order: [["views", "DESC"]],
        limit: 5,
        attributes: ["id", "title", "slug", "views", "likes", "published_at"],
      });

      // Posts recientes
      const recentPosts = await BlogPost.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: [
          "id",
          "title",
          "slug",
          "status",
          "ai_generated",
          "createdAt",
        ],
      });

      res.json({
        success: true,
        data: {
          totals: {
            posts: totalPosts,
            published: publishedPosts,
            drafts: draftPosts,
            ai_generated: aiGeneratedPosts,
            views: totalViews || 0,
            likes: totalLikes || 0,
            pending_suggestions: pendingSuggestions,
          },
          popular_posts: popularPosts,
          recent_posts: recentPosts,
          ai_configured: geminiService.isReady(),
        },
      });
    } catch (error) {
      console.error("Error fetching blog stats:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener estadísticas",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Configurar API Key de Gemini
  static async configureGemini(req: Request, res: Response) {
    try {
      const { apiKey } = req.body;

      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return res.status(400).json({
          error: "Datos inválidos",
          message: "API Key es requerida",
          code: "INVALID_API_KEY",
        });
      }

      // Validar formato básico de la API Key de Gemini
      if (!apiKey.startsWith("AIza")) {
        return res.status(400).json({
          error: "Datos inválidos",
          message: "API Key inválida. Debe comenzar con 'AIza'",
          code: "INVALID_API_KEY_FORMAT",
        });
      }

      // Verificar la API Key haciendo una llamada de prueba
      const testService = new GeminiService();
      // Temporalmente establecer la API Key para la verificación
      (testService as any).genAI = new GoogleGenerativeAI(apiKey.trim());
      (testService as any).model = (testService as any).genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
      (testService as any).isConfigured = true;
      
      const isValid = await testService.verifyApiKey();
      if (!isValid) {
        return res.status(400).json({
          error: "API Key inválida",
          message: "La API Key proporcionada no es válida o no funciona correctamente",
          code: "INVALID_API_KEY",
        });
      }

      const envPath = path.join(__dirname, "../../.env");

      // Leer el archivo .env actual
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }

      // Actualizar o agregar GEMINI_API_KEY
      const lines = envContent.split("\n");
      let keyFound = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.startsWith("GEMINI_API_KEY=")) {
          lines[i] = `GEMINI_API_KEY=${apiKey.trim()}`;
          keyFound = true;
          break;
        }
      }

      if (!keyFound) {
        lines.push(`GEMINI_API_KEY=${apiKey.trim()}`);
      }

      // Escribir el archivo .env actualizado
      fs.writeFileSync(envPath, lines.join("\n"), "utf8");

      // Actualizar la variable de entorno en el proceso actual
      process.env.GEMINI_API_KEY = apiKey.trim();

      console.log("✅ Gemini API Key configured successfully");

      res.json({
        success: true,
        message:
          "API Key configurada exitosamente. Por favor reinicia el servidor para aplicar los cambios.",
        data: {
          configured: true,
          restart_required: true,
        },
      });
    } catch (error: any) {
      console.error("❌ Error configuring Gemini API Key:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error.message || "Error al configurar API Key",
        code: "CONFIG_ERROR",
      });
    }
  }

  // Cargar datos de demostración
  static async loadDemoData(req: Request, res: Response) {
    try {
      console.log("📦 Loading demo blog posts...");

      const demoPosts = [
        {
          title: "Las Mejores Laptops Gaming 2024: Guía Completa de Compra",
          slug: "mejores-laptops-gaming-2024-guia-compra",
          excerpt:
            "Descubre las laptops gaming más potentes del mercado. Análisis detallado de rendimiento, precio y características para gamers exigentes.",
          content: `# Las Mejores Laptops Gaming 2024

¿Estás buscando la laptop gaming perfecta? En esta guía completa te ayudamos a elegir el equipo ideal para tus necesidades.

## ¿Qué hace que una laptop sea ideal para gaming?

El gaming requiere componentes potentes que puedan manejar gráficos intensivos y procesamiento rápido:

### Procesador (CPU)
- **Intel Core i7/i9** o **AMD Ryzen 7/9**: Para juegos AAA
- Mínimo 6 núcleos para gaming moderno
- Frecuencias altas para mejor rendimiento

### Tarjeta Gráfica (GPU)
- **NVIDIA RTX 40 Series**: Ray tracing y DLSS 3.0
- **AMD Radeon RX 7000**: Excelente relación precio-rendimiento
- Mínimo 6GB VRAM para juegos actuales

### Memoria RAM
- **16GB DDR5**: Estándar actual
- **32GB**: Ideal para streaming y multitarea
- Velocidades de 4800MHz o superiores

### Almacenamiento
- **SSD NVMe Gen 4**: Tiempos de carga ultrarrápidos
- Mínimo 512GB, recomendado 1TB
- Considera espacio para varios juegos AAA

## Top 5 Laptops Gaming 2024

### 1. ASUS ROG Strix G18
- RTX 4080, Intel Core i9-13980HX
- 32GB RAM, 1TB SSD
- Pantalla 18" 240Hz
- **Precio aprox:** S/. 8,500

### 2. MSI Titan GT77
- RTX 4090, Intel Core i9-13950HX
- 64GB RAM, 2TB SSD
- Pantalla 17.3" 4K 144Hz
- **Precio aprox:** S/. 12,000

### 3. Lenovo Legion Pro 7i
- RTX 4070, Intel Core i7-13700HX
- 16GB RAM, 1TB SSD
- Pantalla 16" 240Hz
- **Precio aprox:** S/. 6,500

### 4. Acer Predator Helios 16
- RTX 4060, Intel Core i7-13700HX
- 16GB RAM, 512GB SSD
- Pantalla 16" 165Hz
- **Precio aprox:** S/. 5,200

### 5. HP Omen 17
- RTX 4070, AMD Ryzen 9 7940HS
- 32GB RAM, 1TB SSD
- Pantalla 17.3" QHD 240Hz
- **Precio aprox:** S/. 7,800

## Consideraciones Importantes

### Refrigeración
El cooling es crucial. Busca laptops con:
- Sistema de doble ventilador
- Heat pipes de cobre
- Diseño de flujo de aire optimizado

### Portabilidad vs Rendimiento
- Equipos de 15-16": Buen balance
- 17-18": Máximo rendimiento, menos portables
- Peso: Considera si la llevarás frecuentemente

### Batería
Las gaming laptops consumen mucha energía:
- 2-3 horas en tareas ligeras
- 1-1.5 horas en gaming
- Siempre ten el cargador cerca

## Consejos de Compra

1. **Define tu presupuesto**: S/. 4,000 - S/. 12,000+
2. **Identifica tus juegos**: ¿Qué títulos jugarás?
3. **Verifica la garantía**: Mínimo 1 año
4. **Lee reviews**: Busca opiniones reales
5. **Compara precios**: Puede variar entre tiendas

## Conclusión

Invertir en una laptop gaming es una decisión importante. Evalúa tus necesidades, presupuesto y los juegos que planeas jugar. En Peruana Informática te asesoramos para encontrar el equipo perfecto.

¿Necesitas ayuda? ¡Contáctanos para recomendaciones personalizadas!`,
          featured_image: "https://picsum.photos/seed/gaming-laptop/800/400",
          meta_title:
            "Mejores Laptops Gaming 2024 - Guía de Compra | Peruana Informática",
          meta_description:
            "Guía completa de las mejores laptops gaming 2024. Comparativa de precio, rendimiento y características. Encuentra tu laptop gaming ideal.",
          meta_keywords:
            "laptops gaming, gaming laptop 2024, mejor laptop gaming, RTX 4090, laptops para gamers, gaming portátil",
          author_name: "Peruana Informática",
          tags: "gaming, laptops, hardware, reviews, guías",
          categories: "Gaming, Hardware, Guías de Compra",
          status: "published" as "published",
          is_featured: true,
          published_at: new Date(),
        },
        {
          title:
            "Cómo Armar tu PC Gamer desde Cero: Guía Paso a Paso para Principiantes",
          slug: "como-armar-pc-gamer-guia-principiantes",
          excerpt:
            "Aprende a ensamblar tu primera PC gamer con esta guía detallada. Desde elegir componentes hasta el primer encendido.",
          content: `# Cómo Armar tu PC Gamer desde Cero

Armar tu propia PC gamer es más fácil de lo que piensas. Esta guía te llevará paso a paso por el proceso completo.

## Componentes Necesarios

### 1. Procesador (CPU)
El cerebro de tu PC. Opciones recomendadas:
- **Budget**: AMD Ryzen 5 5600 (~S/. 600)
- **Mid-range**: Intel Core i5-13400F (~S/. 900)
- **High-end**: AMD Ryzen 7 7800X3D (~S/. 2,200)

### 2. Tarjeta Madre (Motherboard)
Conecta todos los componentes:
- Verifica compatibilidad con tu CPU
- Socket correcto (AM5, LGA1700, etc.)
- Suficientes puertos USB y slots PCIe

### 3. Tarjeta Gráfica (GPU)
El componente más importante para gaming:
- **1080p**: RTX 4060 / RX 7600 (~S/. 1,500)
- **1440p**: RTX 4070 / RX 7800 XT (~S/. 2,500)
- **4K**: RTX 4080 / RX 7900 XTX (~S/. 5,000+)

### 4. Memoria RAM
16GB mínimo para gaming moderno:
- DDR4 3200MHz o DDR5 5600MHz
- 2 módulos de 8GB (dual channel)
- Marcas: Corsair, Kingston, G.Skill

### 5. Almacenamiento
- **SSD NVMe 500GB-1TB**: Sistema y juegos principales
- **HDD 1-2TB** (opcional): Almacenamiento extra

### 6. Fuente de Poder (PSU)
No escatimes aquí:
- Certificación 80+ Bronze mínimo
- 650W para builds mid-range
- 850W+ para high-end
- Marcas: Corsair, EVGA, Seasonic

### 7. Case (Gabinete)
Elige uno con:
- Buen flujo de aire
- Espacio para tu GPU
- Ventiladores incluidos
- Gestión de cables

### 8. Cooler CPU
- **Stock**: Viene con algunos CPUs
- **Tower**: Better cooling (~S/. 150-400)
- **AIO Liquid**: Premium cooling (~S/. 500+)

## Herramientas Necesarias

- Destornillador Phillips
- Pulsera antiestática (opcional pero recomendada)
- Espacio de trabajo limpio
- Buena iluminación

## Proceso de Ensamblaje

### Paso 1: Preparar el Case
1. Abre ambos paneles laterales
2. Retira bandejas y tornillos extras
3. Instala I/O shield de la motherboard

### Paso 2: Instalar CPU
1. Abre el socket del motherboard
2. Alinea el CPU (no fuerces)
3. Cierra la palanca del socket
4. Aplica pasta térmica si es necesario

### Paso 3: Instalar RAM
1. Abre los clips de los slots
2. Alinea las muescas de la RAM
3. Presiona firmemente hasta que clic
4. Verifica que los clips estén cerrados

### Paso 4: Instalar Cooler CPU
1. Sigue instrucciones del fabricante
2. Asegura el backplate
3. Aplica presión uniforme
4. Conecta el cable del ventilador

### Paso 5: Montar Motherboard en Case
1. Instala standoffs en posiciones correctas
2. Coloca motherboard cuidadosamente
3. Atornilla en cruz (no aprietes mucho)
4. Conecta cables frontales

### Paso 6: Instalar SSD/HDD
1. Monta SSD en slot M.2
2. Atornilla el SSD
3. Monta HDD en bahías (si aplica)

### Paso 7: Instalar GPU
1. Remueve slot covers necesarios
2. Alinea GPU con slot PCIe x16
3. Presiona firmemente hasta clic
4. Atornilla al case

### Paso 8: Conectar PSU
1. Monta PSU en el case
2. Conecta cable 24-pin a motherboard
3. Conecta CPU power (4+4 pin)
4. Conecta PCIe power a GPU
5. Conecta SATA/molex si es necesario

### Paso 9: Cable Management
1. Organiza cables por detrás
2. Usa zip ties incluidos
3. Mejora flujo de aire
4. Aspecto más limpio

### Paso 10: Primer Encendido
1. Conecta monitor a GPU (no motherboard)
2. Conecta teclado y mouse
3. Conecta cable de poder
4. Presiona botón de encendido
5. Entra a BIOS (Del/F2)

## Instalación de Software

### 1. Instalar Windows
- Crea USB booteable
- Sigue wizard de instalación
- Instala en SSD principal

### 2. Instalar Drivers
- GPU: NVIDIA GeForce Experience o AMD Software
- Chipset: Desde web del fabricante
- Drivers de motherboard

### 3. Software Esencial
- Navegador web
- Antivirus
- Discord
- Steam/Epic Games
- Monitoring tools (HWiNFO, MSI Afterburner)

## Troubleshooting Común

### No Enciende
- Verifica PSU switch (I/O)
- Revisa cable 24-pin
- Verifica cable CPU power
- Chequea conexión panel frontal

### No Hay Video
- Monitor conectado a GPU (no motherboard)
- GPU bien insertada
- Cables PCIe power conectados
- Intenta con un solo stick RAM

### Temperaturas Altas
- Cooler bien montado
- Pasta térmica aplicada
- Ventiladores funcionando
- Flujo de aire adecuado

## Consejos Finales

1. **Tómate tu tiempo**: No hay prisa
2. **Lee manuales**: Especialmente motherboard
3. **Organiza componentes**: Antes de empezar
4. **No fuerces nada**: Si no entra fácil, algo está mal
5. **Pide ayuda si necesitas**: Comunidad tech siempre ayuda

## Conclusión

¡Felicidades! Has armado tu PC gamer. Es una experiencia gratificante y has ahorrado dinero versus comprar pre-armada.

¿Necesitas componentes? En Peruana Informática tenemos todo lo que necesitas con asesoría personalizada.

¡Disfruta tu nueva PC! 🎮`,
          featured_image: "https://picsum.photos/seed/pc-build/800/400",
          meta_title: "Cómo Armar una PC Gamer - Guía Completa 2024",
          meta_description:
            "Guía paso a paso para armar tu primera PC gamer. Aprende a ensamblar componentes, instalar software y troubleshooting común.",
          meta_keywords:
            "armar pc gamer, como armar pc, ensamblar computadora, build pc gaming, componentes pc",
          author_name: "Peruana Informática",
          tags: "pc gaming, tutorial, hardware, ensamblaje, guía",
          categories: "Tutoriales, Hardware, Gaming",
          status: "published" as "published",
          is_featured: true,
          published_at: new Date(Date.now() - 86400000), // 1 día atrás
        },
        {
          title: "SSD vs HDD: ¿Cuál Elegir para tu Computadora en 2024?",
          slug: "ssd-vs-hdd-cual-elegir-2024",
          excerpt:
            "Comparativa completa entre SSD y HDD. Velocidad, precio, durabilidad y casos de uso para tomar la mejor decisión.",
          content: `# SSD vs HDD: La Batalla del Almacenamiento

La elección entre SSD y HDD puede impactar dramáticamente el rendimiento de tu PC. Veamos las diferencias.

## ¿Qué son?

### HDD (Hard Disk Drive)
- Discos magnéticos giratorios
- Tecnología desde 1956
- Mecánico con partes móviles
- Más barato por GB

### SSD (Solid State Drive)
- Chips de memoria flash
- Sin partes móviles
- Mucho más rápido
- Más caro pero cada vez más accesible

## Comparativa Detallada

### Velocidad 📊

**HDD:**
- Lectura: 80-160 MB/s
- Escritura: 80-160 MB/s
- Latencia: 5-10ms

**SSD SATA:**
- Lectura: 500-550 MB/s
- Escritura: 450-520 MB/s
- Latencia: <0.1ms

**SSD NVMe:**
- Lectura: 3,000-7,000 MB/s
- Escritura: 2,000-6,000 MB/s
- Latencia: <0.1ms

### Durabilidad 🛡️

**HDD:**
- Sensible a golpes y vibraciones
- Vida útil: 3-5 años típicamente
- Fallas mecánicas comunes

**SSD:**
- Resistente a impactos
- Vida útil: 5-10 años
- Límite de escrituras (TBW)
- Más confiable en general

### Precio 💰

**HDD (2024):**
- 1TB: S/. 150-200
- 2TB: S/. 250-300
- 4TB: S/. 400-500

**SSD SATA (2024):**
- 500GB: S/. 150-200
- 1TB: S/. 250-350
- 2TB: S/. 500-700

**SSD NVMe (2024):**
- 500GB: S/. 200-300
- 1TB: S/. 300-500
- 2TB: S/. 600-1,000

### Consumo de Energía ⚡

**HDD:**
- 6-15W en operación
- Más calor generado
- Afecta laptops

**SSD:**
- 2-5W en operación
- Menos calor
- Mejor para portátiles

### Ruido 🔊

**HDD:**
- Ruido audible al girar
- Clics y zumbidos
- Puede ser molesto

**SSD:**
- Completamente silencioso
- Sin partes móviles
- Operación silenciosa

## Casos de Uso

### Elige HDD si:
✅ Necesitas mucho almacenamiento barato
✅ Archivos, backups, media storage
✅ Presupuesto muy limitado
✅ No requieres velocidad

### Elige SSD SATA si:
✅ Upgrade de laptop vieja
✅ PC con solo puertos SATA
✅ Balance precio-rendimiento
✅ Sistema operativo y programas

### Elige SSD NVMe si:
✅ PC gaming o workstation
✅ Edición de video/3D
✅ Quieres máximo rendimiento
✅ Motherboard soporta M.2

## Configuración Ideal 2024

### Build Budget (S/. 2,000-3,000)
- SSD NVMe 500GB: Sistema + juegos principales
- HDD 1TB: Storage extra (opcional)

### Build Mid-Range (S/. 4,000-6,000)
- SSD NVMe 1TB: Sistema + juegos
- HDD 2TB: Media y archivos

### Build High-End (S/. 8,000+)
- SSD NVMe Gen4 1-2TB: Sistema y juegos
- SSD SATA 2TB: Proyectos de trabajo
- HDD 4TB: Backups y archivo

## Impacto en Gaming 🎮

### Tiempos de Carga (Ejemplo: Cyberpunk 2077)

**HDD:** 2-3 minutos
**SSD SATA:** 30-45 segundos
**SSD NVMe:** 15-20 segundos

### DirectStorage (Windows 11)
- Requiere SSD NVMe
- Carga texturas directo a GPU
- Mejora dramática en juegos compatibles

## Mantenimiento

### HDD
- Defragmentar regularmente
- Evitar movimientos bruscos
- Monitorear SMART status
- Backup frecuente

### SSD
- NO defragmentar (daña el SSD)
- Actualizar firmware
- Dejar 10-20% espacio libre
- Habilitar TRIM en Windows

## Tecnologías Emergentes

### QLC vs TLC vs SLC
- **SLC**: Más rápido y durable, muy caro
- **TLC**: Balance ideal
- **QLC**: Más barato, menos durable

### PCIe Gen 5
- Velocidades hasta 14,000 MB/s
- Disponible en 2024
- Requiere hardware nuevo

## Mitos Comunes

❌ **"Los SSD se mueren rápido"**
✅ Realidad: Duran años de uso normal

❌ **"HDD son más confiables"**
✅ Realidad: SSD tienen menos fallas

❌ **"No se nota la diferencia"**
✅ Realidad: La diferencia es ENORME

## Conclusión

En 2024, un SSD es prácticamente obligatorio como disco principal. Los HDD aún tienen su lugar para almacenamiento masivo económico.

**Recomendación:**
- SSD NVMe para sistema operativo
- HDD opcional para archivos grandes
- Prioriza SSD en tu presupuesto

¿Necesitas ayuda eligiendo? En Peruana Informática te asesoramos según tu caso específico.`,
          featured_image: "https://picsum.photos/seed/storage/800/400",
          meta_title: "SSD vs HDD 2024: ¿Cuál Elegir? Comparativa Completa",
          meta_description:
            "Comparativa detallada SSD vs HDD 2024. Velocidad, precio, durabilidad. Descubre cuál es mejor para tu PC.",
          meta_keywords:
            "ssd vs hdd, diferencia ssd hdd, mejor almacenamiento pc, nvme vs sata, disco duro vs ssd",
          author_name: "Peruana Informática",
          tags: "almacenamiento, ssd, hdd, hardware, comparativa",
          categories: "Hardware, Comparativas, Guías",
          status: "published" as "published",
          is_featured: false,
          published_at: new Date(Date.now() - 172800000), // 2 días atrás
        },
      ];

      // Crear posts con cálculo de word_count y reading_time
      const createdPosts = await Promise.all(
        demoPosts.map(async (postData) => {
          const wordCount = postData.content.split(/\s+/).length;
          const readingTime = Math.ceil(wordCount / 200);

          return await BlogPost.create({
            ...postData,
            word_count: wordCount,
            reading_time: readingTime,
            ai_generated: false,
          });
        }),
      );

      console.log(`✅ Created ${createdPosts.length} demo blog posts`);

      res.status(201).json({
        success: true,
        message: `${createdPosts.length} posts de demostración creados exitosamente`,
        data: {
          posts: createdPosts,
          count: createdPosts.length,
        },
      });
    } catch (error: any) {
      console.error("❌ Error loading demo data:", error);
      res.status(500).json({
        error: "Error cargando datos demo",
        message: error.message || "Error al crear posts de demostración",
        code: "DEMO_DATA_ERROR",
      });
    }
  }
}
