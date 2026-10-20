import { Request, Response } from "express";
import { SeoSettings } from "../models/SeoSettings";
import { Op } from "sequelize";
import { pickSeoSettingsFields } from "../utils/seoFields";
import { logger } from '../config/logger';

export class SeoPageController {
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
      logger.error("Error fetching SEO settings by page type:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener la configuración SEO",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Crear nueva configuración SEO

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

      await seoSettings.update(pickSeoSettingsFields(req.body));

      res.json({
        success: true,
        message: "Configuración SEO actualizada exitosamente",
        data: seoSettings,
      });
    } catch (error: any) {
      logger.error("Error updating SEO settings by page type:", error);

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
}
