import express from 'express';
import { generateQuotationPdf } from '../controllers/PdfQuotationController';

const router = express.Router();

// Ruta para generar PDF de cotización
router.get('/:code', generateQuotationPdf);

export default router;