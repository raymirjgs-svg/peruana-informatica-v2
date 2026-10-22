import { Request, Response } from "express";
import { SeoSettings } from "../models/SeoSettings";
import { sendError } from '../middleware/errorHandler';

export class SeoAnalysisController {
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
      return sendError(res, error, "Error al generar el análisis SEO", 500, "INTERNAL_SERVER_ERROR");
    }
  }
}
