import { Request, Response } from "express";
import { SeoSettings } from "../models/SeoSettings";
import { Op, ValidationError, type WhereOptions } from "sequelize";
import { pickSeoSettingsFields } from "../utils/seoFields";
import { sendError } from '../middleware/errorHandler';

export class SeoPageController {
  static async getByPageType(req: Request, res: Response) {
    try {
      const { page_type } = req.params;
      const { page_identifier } = req.query;

      const whereClause: WhereOptions = { page_type };

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
      return sendError(res, error, "Error al obtener la configuración SEO", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  // Crear nueva configuración SEO

  static async updateByPageType(req: Request, res: Response) {
    try {
      const { page_type } = req.params;
      const { page_identifier } = req.query;

      const whereClause: WhereOptions = { page_type };

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
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => ({
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

      return sendError(res, error, "Error al actualizar la configuración SEO", 500, "INTERNAL_SERVER_ERROR");
    }
  }
}
