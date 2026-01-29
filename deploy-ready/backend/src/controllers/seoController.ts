import { Request, Response } from "express";
import { SeoSettings } from "../models/SeoSettings";
import { Op } from "sequelize";
import { geminiService } from "../services/GeminiService";

export class SeoController {
  // Obtener todas las configuraciones SEO
  static async getAll(req: Request, res: Response) {
    try {
      const { page_type, is_active } = req.query;
      const whereClause: any = {};

      if (page_type) {
        whereClause.page_type = page_type;
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active === "true";
      }

      const seoSettings = await SeoSettings.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
      });

      res.json({
        success: true,
        data: seoSettings,
      });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener las configuraciones SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener configuración SEO por tipo de página
  static async getByPageType(req: Request, res: Response) {
    try {
      const { page_type } = req.params;
      const { page_identifier } = req.query;

      const whereClause: any = { page_type };

      if (page_identifier) {
        whereClause.page_identifier = page_identifier;
      } else {
        whereClause.page_identifier = { [Op.is]: null };
      }

      const seoSettings = await SeoSettings.findOne({
        where: whereClause,
      });

      if (!seoSettings) {
        return res.status(404).json({
          error: "Configuración no encontrada",
          message: "No se encontró configuración SEO para esta página",
          code: "SEO_CONFIG_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: seoSettings,
      });
    } catch (error) {
      console.error("Error fetching SEO settings by page type:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Crear nueva configuración SEO
  static async create(req: Request, res: Response) {
    try {
      console.log("🔧 Creating SEO settings");
      console.log("Request body:", req.body);

      const {
        page_type,
        page_identifier,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        og_image,
        twitter_title,
        twitter_description,
        twitter_image,
        canonical_url,
        robots,
        schema_markup,
        custom_head,
        priority,
        change_frequency,
        is_active,
      } = req.body;

      // Validar datos requeridos
      if (!page_type) {
        return res.status(400).json({
          error: "Datos incompletos",
          message: "El tipo de página es requerido",
          code: "MISSING_PAGE_TYPE",
        });
      }

      // Verificar si ya existe una configuración para esta página
      const existingConfig = await SeoSettings.findOne({
        where: {
          page_type,
          page_identifier: page_identifier || null,
        },
      });

      if (existingConfig) {
        return res.status(409).json({
          error: "Configuración existente",
          message: "Ya existe una configuración SEO para esta página",
          code: "SEO_CONFIG_EXISTS",
        });
      }

      const newSeoSettings = await SeoSettings.create({
        page_type,
        page_identifier,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        og_image,
        twitter_title,
        twitter_description,
        twitter_image,
        canonical_url,
        robots: robots || "index,follow",
        schema_markup,
        custom_head,
        priority: priority || 0.5,
        change_frequency: change_frequency || "weekly",
        is_active: is_active !== undefined ? is_active : true,
      });

      console.log("✅ SEO settings created with ID:", newSeoSettings.id);

      res.status(201).json({
        success: true,
        message: "Configuración SEO creada exitosamente",
        data: newSeoSettings,
      });
    } catch (error: any) {
      console.error("❌ Error creating SEO settings:", error);

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
        message: "Error al crear la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Actualizar configuración SEO
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("🔧 Updating SEO settings ID:", id);
      console.log("Request body:", req.body);

      const seoSettings = await SeoSettings.findByPk(id);

      if (!seoSettings) {
        return res.status(404).json({
          error: "Configuración no encontrada",
          message: "No se encontró la configuración SEO solicitada",
          code: "SEO_CONFIG_NOT_FOUND",
        });
      }

      const {
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        og_image,
        twitter_title,
        twitter_description,
        twitter_image,
        canonical_url,
        robots,
        schema_markup,
        custom_head,
        priority,
        change_frequency,
        is_active,
      } = req.body;

      await seoSettings.update({
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        og_image,
        twitter_title,
        twitter_description,
        twitter_image,
        canonical_url,
        robots,
        schema_markup,
        custom_head,
        priority,
        change_frequency,
        is_active,
      });

      console.log("✅ SEO settings updated successfully");

      res.json({
        success: true,
        message: "Configuración SEO actualizada exitosamente",
        data: seoSettings,
      });
    } catch (error: any) {
      console.error("❌ Error updating SEO settings:", error);

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
        message: "Error al actualizar la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener configuración SEO por ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const seoSettings = await SeoSettings.findByPk(id);

      if (!seoSettings) {
        return res.status(404).json({
          error: "Configuración no encontrada",
          message: "No se encontró la configuración SEO solicitada",
          code: "SEO_CONFIG_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: seoSettings,
      });
    } catch (error) {
      console.error("Error fetching SEO settings by ID:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Eliminar configuración SEO
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const seoSettings = await SeoSettings.findByPk(id);

      if (!seoSettings) {
        return res.status(404).json({
          error: "Configuración no encontrada",
          message: "No se encontró la configuración SEO solicitada",
          code: "SEO_CONFIG_NOT_FOUND",
        });
      }

      await seoSettings.destroy();

      res.json({
        success: true,
        message: "Configuración SEO eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting SEO settings:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al eliminar la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener análisis SEO del sitio
  static async getSeoAnalysis(req: Request, res: Response) {
    try {
      const allSettings = await SeoSettings.findAll({
        where: { is_active: true },
      });

      const analysis = {
        totalPages: allSettings.length,
        optimizedPages: 0,
        pagesNeedingAttention: 0,
        missingMetaTitle: 0,
        missingMetaDescription: 0,
        missingKeywords: 0,
        incompleteOpenGraph: 0,
        incompleteTwitter: 0,
        pagesByType: {} as any,
        recommendations: [] as string[],
      };

      analysis.recommendations = [];

      // Detalles de páginas con problemas
      const pagesWithIssues: any[] = [];

      // Analizar cada configuración
      allSettings.forEach((setting) => {
        let needsAttention = false;
        const issues: string[] = [];

        // Contar por tipo de página
        if (!analysis.pagesByType[setting.page_type]) {
          analysis.pagesByType[setting.page_type] = 0;
        }
        analysis.pagesByType[setting.page_type]++;

        // Verificar meta título
        if (!setting.meta_title) {
          analysis.missingMetaTitle++;
          needsAttention = true;
          issues.push("Falta título meta");
        } else if (setting.meta_title.length < 30 || setting.meta_title.length > 60) {
          issues.push("Longitud de título meta no óptima (30-60 caracteres)");
          needsAttention = true;
        }

        // Verificar meta descripción
        if (!setting.meta_description) {
          analysis.missingMetaDescription++;
          needsAttention = true;
          issues.push("Falta descripción meta");
        } else if (setting.meta_description.length < 120 || setting.meta_description.length > 160) {
          issues.push("Longitud de descripción meta no óptima (120-160 caracteres)");
          needsAttention = true;
        }

        // Verificar keywords
        if (!setting.meta_keywords) {
          analysis.missingKeywords++;
          needsAttention = true;
          issues.push("Faltan palabras clave");
        }

        // Verificar Open Graph
        if (!setting.hasCompleteOpenGraph()) {
          analysis.incompleteOpenGraph++;
          needsAttention = true;
          issues.push("Open Graph incompleto (Facebook)");
        }

        // Verificar Twitter
        if (!setting.hasCompleteTwitter()) {
          analysis.incompleteTwitter++;
          needsAttention = true;
          issues.push("Twitter Cards incompleto");
        }

        if (needsAttention) {
          analysis.pagesNeedingAttention++;
          pagesWithIssues.push({
            id: setting.id,
            page_type: setting.page_type,
            page_identifier: setting.page_identifier,
            issues
          });
        } else {
          analysis.optimizedPages++;
        }
      });

      // Generar recomendaciones generales basadas en los hallazgos
      if (analysis.missingMetaTitle > 0) {
        analysis.recommendations.push(
          `Prioritario: Tienes ${analysis.missingMetaTitle} página(s) sin título meta. Esto es crítico para el ranking.`
        );
      }
      if (analysis.missingMetaDescription > 0) {
        analysis.recommendations.push(
          `Mejora: ${analysis.missingMetaDescription} página(s) necesitan una descripción meta para mejorar el CTR.`
        );
      }
      if (analysis.incompleteOpenGraph > 0) {
        analysis.recommendations.push(
          `Social Media: Optimiza el Open Graph de ${analysis.incompleteOpenGraph} página(s) para que se vean bien al compartirse.`
        );
      }
      if (analysis.pagesNeedingAttention > 0) {
        analysis.recommendations.push(
          `Consejo: Revisa los detalles específicos de las ${analysis.pagesNeedingAttention} páginas marcadas para llegar al 100%.`
        );
      }

      // Calcular score SEO (0-100) más realista
      const totalPossibleCriterias = analysis.totalPages * 5;
      const totalIssues =
        analysis.missingMetaTitle +
        analysis.missingMetaDescription +
        analysis.missingKeywords +
        analysis.incompleteOpenGraph +
        analysis.incompleteTwitter;

      let score = 100;
      if (totalPossibleCriterias > 0) {
        score = Math.max(0, Math.round(((totalPossibleCriterias - totalIssues) / totalPossibleCriterias) * 100));
      }

      res.json({
        success: true,
        data: {
          score,
          analysis,
          pagesWithIssues,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error("Error generating SEO analysis:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al generar el análisis SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Actualizar configuración por tipo de página (para configuraciones globales)
  static async updateByPageType(req: Request, res: Response) {
    try {
      const { page_type } = req.params;
      const { page_identifier } = req.query;

      const whereClause: any = { page_type };

      if (page_identifier) {
        whereClause.page_identifier = page_identifier;
      } else {
        whereClause.page_identifier = { [Op.is]: null };
      }

      const seoSettings = await SeoSettings.findOne({
        where: whereClause,
      });

      if (!seoSettings) {
        return res.status(404).json({
          error: "Configuración no encontrada",
          message: "No se encontró configuración SEO para esta página",
          code: "SEO_CONFIG_NOT_FOUND",
        });
      }

      await seoSettings.update(req.body);

      res.json({
        success: true,
        message: "Configuración SEO actualizada exitosamente",
        data: seoSettings,
      });
    } catch (error: any) {
      console.error("Error updating SEO settings by page type:", error);

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
        message: "Error al actualizar la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Sugerir metadatos con AI (Gemini)
  static async suggestMetadata(req: Request, res: Response) {
    try {
      const { page_type, page_identifier, current_title, current_description } = req.body;

      if (!geminiService.isReady()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de IA no disponible",
          message: "Configure su GEMINI_API_KEY para usar esta función"
        });
      }

      let context = "";
      if (page_type === 'global') context = "Configuración global de la tienda Peruana Informática.";
      else if (page_type === 'home') context = "Página principal de la tienda de tecnología.";
      else if (page_type === 'product' && page_identifier) context = `Producto tecnológico con slug: ${page_identifier}.`;
      else context = `Página de tipo ${page_type}.`;

      const prompt = `Como experto SEO, genera sugerencias para los metadatos de una página de una tienda tecnológica en Perú llamada "Peruana Informática".
      
      Contexto: ${context}
      Título actual: ${current_title || 'N/A'}
      Descripción actual: ${current_description || 'N/A'}

      Genera:
      1. Un Meta Title optimizado (50-60 caracteres).
      2. Una Meta Description persuasiva (120-160 caracteres).
      3. 5 Keywords relevantes separadas por comas.
      4. Títulos y descripciones para OpenGraph y Twitter.

      Responde SOLO con un objeto JSON válido con este formato:
      {
        "meta_title": "...",
        "meta_description": "...",
        "meta_keywords": "...",
        "og_title": "...",
        "og_description": "...",
        "twitter_title": "...",
        "twitter_description": "..."
      }`;

      const suggestions = await geminiService.generateJson(prompt);

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error("Error suggesting metadata via AI:", error);
      res.status(500).json({
        success: false,
        error: "Error al generar sugerencias con IA",
        message: "Ocurrió un error al procesar la solicitud con Gemini"
      });
    }
  }
}
