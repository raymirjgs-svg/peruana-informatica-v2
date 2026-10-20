import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { TaxonomyController } from '../../controllers/TaxonomyController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Middleware de validación
const validateRequest = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
    }
    next();
};

// ============ ASIGNACIÓN DE TAXONOMÍA ============

// POST asignar marca, categoría y subcategorías a un producto
router.post('/assign', TaxonomyController.assignTaxonomy);

// POST asignación masiva de taxonomía
router.post('/bulk-assign', TaxonomyController.bulkAssignTaxonomy);

// ============ CATEGORÍAS ============

// GET todas las categorías con sus subcategorías
router.get('/categories', TaxonomyController.getAllCategories);

// POST crear nueva categoría
router.post('/categories', [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('slug').trim().notEmpty().withMessage('El slug es requerido'),
], validateRequest, TaxonomyController.createCategory);

// PUT actualizar categoría
router.put('/categories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('slug').optional().trim().notEmpty().withMessage('El slug no puede estar vacío'),
], validateRequest, TaxonomyController.updateCategory);

// DELETE eliminar categoría
router.delete('/categories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, TaxonomyController.deleteCategory);

// ============ SUBCATEGORÍAS ============

// GET todas las subcategorías
router.get('/subcategories', TaxonomyController.getAllSubCategories);

// POST crear nueva subcategoría
router.post('/subcategories', [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('slug').trim().notEmpty().withMessage('El slug es requerido'),
    body('category_id').isInt({ min: 1 }).withMessage('La categoría es requerida'),
], validateRequest, TaxonomyController.createSubCategory);

// PUT actualizar subcategoría
router.put('/subcategories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('slug').optional().trim().notEmpty().withMessage('El slug no puede estar vacío'),
    body('category_id').optional().isInt({ min: 1 }).withMessage('ID de categoría inválido'),
], validateRequest, TaxonomyController.updateSubCategory);

// DELETE eliminar subcategoría (soft delete)
router.delete('/subcategories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, TaxonomyController.deleteSubCategory);

export default router;