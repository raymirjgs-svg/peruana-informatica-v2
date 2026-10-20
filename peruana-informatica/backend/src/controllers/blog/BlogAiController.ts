import { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost";
import { BlogTitleSuggestion } from "../../models/BlogTitleSuggestion";
import { geminiService, GeminiService } from "../../services/GeminiService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Op } from "sequelize";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../../config/logger";

export class BlogAiController {
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

      logger.info(
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
      logger.error("❌ Error generating titles:", error);
      
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
        message: "Error al generar títulos con IA",
        code: "AI_GENERATION_ERROR",
      });
    }
  }

  static async getTitleSuggestions(req: Request, res: Response) {
    try {
      const { status, topic } = req.query;
      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      if (topic) {
        whereClause.topic = {
          [Op.like]: `%${topic}%`,
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
      logger.error("Error fetching title suggestions:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener las sugerencias",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

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

      logger.info(`🤖 Generating content for: ${suggestion.suggested_title}`);

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
        logger.info("✅ Generated featured image URL");
      } catch (imageError) {
        logger.warn("⚠️ Could not generate image:", imageError);
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

      logger.info("✅ AI-generated blog post created:", newPost.id);

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
      logger.error("❌ Error generating content:", error);
      
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
        message: "Error al generar contenido con IA",
        code: "AI_GENERATION_ERROR",
      });
    }
  }

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
      logger.error("Error managing title suggestion:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al gestionar la sugerencia",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

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

      logger.info("✅ Gemini API Key configured successfully");

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
      logger.error("❌ Error configuring Gemini API Key:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al configurar API Key",
        code: "CONFIG_ERROR",
      });
    }
  }
}
