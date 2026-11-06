import { Request, Response } from 'express';
import { PdfQuotationService } from '../services/PdfQuotationService';

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
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Error al generar el PDF de la cotización',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};