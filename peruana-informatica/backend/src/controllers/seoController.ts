import { Request, Response } from "express";
import { SeoSettings } from "../models/SeoSettings";
import { pickSeoSettingsFields } from "../utils/seoFields";
import { logger } from '../config/logger';

export class SeoController {
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
      logger.error("Error fetching SEO settings:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener las configuraciones SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener configuración SEO por tipo de página

  static async create(req: Request, res: Response) {
    try {
      logger.info("🔧 Creating SEO settings");
      logger.info("Request body:", req.body);

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

      logger.info("✅ SEO settings created with ID:", newSeoSettings.id);

      res.status(201).json({
        success: true,
        message: "Configuración SEO creada exitosamente",
        data: newSeoSettings,
      });
    } catch (error: any) {
      logger.error("❌ Error creating SEO settings:", error);

      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path,
          message: 'Error interno',
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
      logger.info("🔧 Updating SEO settings ID:", id);
      logger.info("Request body:", req.body);

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

      logger.info("✅ SEO settings updated successfully");

      res.json({
        success: true,
        message: "Configuración SEO actualizada exitosamente",
        data: seoSettings,
      });
    } catch (error: any) {
      logger.error("❌ Error updating SEO settings:", error);

      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path,
          message: 'Error interno',
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
      logger.error("Error fetching SEO settings by ID:", error);
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
      logger.error("Error deleting SEO settings:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al eliminar la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}
