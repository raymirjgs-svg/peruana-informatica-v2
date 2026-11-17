import { Request, Response } from "express";
import { geminiService } from "../services/GeminiService";
import { sendError } from '../middleware/errorHandler';

export class SeoSuggestController {
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
      return sendError(res, error, "Ocurrió un error al procesar la solicitud con Gemini");
    }
  }
}
