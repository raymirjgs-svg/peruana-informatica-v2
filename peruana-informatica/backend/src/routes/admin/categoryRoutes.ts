import express, { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { CategoryController } from '../../controllers/admin/CategoryController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

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

// GET todas las categorías
router.get('/', CategoryController.getAll);

// GET categorías para menú
router.get('/menu', CategoryController.getMenu);

// GET categoría por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, CategoryController.getById);

// POST crear categoría
router.post('/', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Nombre es requerido y debe tener entre 1 y 100 caracteres'),
  body('appears_in_menu').optional().isBoolean().withMessage('appears_in_menu debe ser un booleano'),
  body('seo_title').optional().isLength({ max: 160 }).withMessage('SEO title no puede exceder 160 caracteres'),
  body('seo_description').optional().isLength({ max: 300 }).withMessage('SEO description no puede exceder 300 caracteres'),
], validateRequest, CategoryController.create);

// PUT actualizar categoría
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Nombre debe tener entre 1 y 100 caracteres'),
  body('appears_in_menu').optional().isBoolean().withMessage('appears_in_menu debe ser un booleano'),
  body('seo_title').optional().isLength({ max: 160 }).withMessage('SEO title no puede exceder 160 caracteres'),
  body('seo_description').optional().isLength({ max: 300 }).withMessage('SEO description no puede exceder 300 caracteres'),
], validateRequest, CategoryController.update);

// DELETE eliminar categoría
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, CategoryController.delete);

export default router;