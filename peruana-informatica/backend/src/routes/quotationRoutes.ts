import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as QuotationController from '../controllers/QuotationController';
import * as PdfQuotationController from '../controllers/PdfQuotationController';

const router = express.Router();

// Validación de entradas
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// Crear nueva cotización
router.post('/', [
  body('client_name').notEmpty().withMessage('Nombre del cliente es requerido'),
  body('client_email').isEmail().withMessage('Email del cliente no válido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('items.*.product_name').notEmpty().withMessage('Nombre del producto es requerido'),
  body('items.*.product_price').isNumeric().withMessage('Precio del producto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser al menos 1'),
  body('items.*.subtotal').isNumeric().withMessage('Subtotal del producto inválido'),
  body('valid_until').isISO8601().withMessage('Fecha de validez inválida'),
], validateRequest, QuotationController.createQuotation);

// Obtener cotización por código
router.get('/:code', [
  param('code').isString().withMessage('Código de cotización inválido')
], validateRequest, QuotationController.getQuotationByCode);

// Generar PDF de cotización
router.get('/:code/pdf', [
  param('code').isString().withMessage('Código de cotización inválido')
], validateRequest, PdfQuotationController.generateQuotationPdf);

// Listar cotizaciones (solo admin)
router.get('/', [
  query('status').optional().isString().withMessage('Estado inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Número de página inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
], validateRequest, QuotationController.getAllQuotations);

// Obtener detalle de cotización por ID (solo admin)
router.get('/id/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID de cotización inválido')
], validateRequest, QuotationController.getQuotationById);

// Actualizar estado de cotización (solo admin)
router.put('/:id/status', [
  param('id').isInt({ min: 1 }).withMessage('ID de cotización inválido'),
  body('status').isIn(['pending', 'sent', 'accepted', 'rejected', 'expired']).withMessage('Estado inválido'),
], validateRequest, QuotationController.updateQuotationStatus);

// Validar cotización
router.post('/validate', [
  body('code').isString().withMessage('Código de cotización inválido'),
], validateRequest, QuotationController.validateQuotation);

// Obtener componentes compatibles
router.get('/products/:id/compatible/:type', [
  param('id').isInt({ min: 1 }).withMessage('ID de componente inválido'),
  param('type').isString().withMessage('Tipo de componente inválido'),
], validateRequest, QuotationController.getCompatibleComponents);

// Verificar compatibilidad entre dos componentes
router.get('/compatibility/check/:parentId/:childId', [
  param('parentId').isInt({ min: 1 }).withMessage('ID de componente padre inválido'),
  param('childId').isInt({ min: 1 }).withMessage('ID de componente hijo inválido'),
], validateRequest, QuotationController.checkCompatibility);

export default router;