// ============================================
// backend/src/routes/productRoutes.ts
// ============================================
import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { productController } from '../controllers/admin/ProductController';
import { searchRateLimit } from '../middleware/security';

const router = express.Router();

// Middleware de validación
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

// GET sugerencias para autocomplete
router.get('/utils/suggestions', searchRateLimit, [
  query('q').isLength({ min: 1, max: 100 }).withMessage('Query required'),
  query('limit').optional().isInt({ max: 10 }).withMessage('Limit max 10')
], validateRequest, productController.getSuggestions.bind(productController));

// GET todos los productos con filtros y paginación
router.get('/', searchRateLimit, [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
  query('category').optional().isLength({ min: 1, max: 50 }).withMessage('Categoría inválida'),
  query('brand').optional().isLength({ min: 1, max: 50 }).withMessage('Marca inválida'),
  query('featured').optional().isBoolean().withMessage('Featured flag must be boolean'),
  query('new').optional().isBoolean().withMessage('New flag must be boolean'),
  query('clearance').optional().isBoolean().withMessage('Clearance flag must be boolean'),
], validateRequest, productController.getPublicProducts.bind(productController));

// GET producto por slug
router.get('/slug/:slug', [
  param('slug').isLength({ min: 1 }).withMessage('Slug es requerido'),
], validateRequest, productController.getProductBySlug.bind(productController));

// GET producto por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, productController.getPublicProductById.bind(productController));

export default router;