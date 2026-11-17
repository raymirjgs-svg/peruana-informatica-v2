import { Request, Response } from 'express';
import { PdfQuotationService } from '../services/PdfQuotationService';
import { sendError } from '../middleware/errorHandler';

const pdfQuotationService = new PdfQuotationService();

export const generateQuotationPdf = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Código de cotización es requerido'
      });
    }

    const pdfBuffer = await pdfQuotationService.generateQuotationPdf(code);

    // Enviar el PDF como descarga
    res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${code}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};