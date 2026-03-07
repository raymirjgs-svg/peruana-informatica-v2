import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { productController } from '../../controllers/admin/ProductController';

const router = express.Router();

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

// GET todos los productos con paginación y filtros
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
  query('category').optional().isInt({ min: 1 }).withMessage('Categoría inválida'),
  query('brand').optional().isInt({ min: 1 }).withMessage('Marca inválida'),
], validateRequest, productController.getProducts.bind(productController));

// GET erp-lookup/:code - Busca producto en BD local y en API del sistema de ventas
// IMPORTANT: must be before /:id or Express matches 'erp-lookup' as an id and returns 400
router.get('/erp-lookup/:code', productController.erpLookup.bind(productController));

// GET producto por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, productController.getProductById.bind(productController));

// POST crear producto
router.post('/', [
  body('name').notEmpty().isLength({ min: 1, max: 200 }).withMessage('Nombre es requerido y debe tener entre 1 y 200 caracteres'),
  body('description').notEmpty().isLength({ min: 1, max: 50000 }).withMessage('Descripción es requerida'),
  body('price').isFloat({ min: 0 }).withMessage('Precio debe ser un número mayor o igual a 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock debe ser un número entero mayor o igual a 0'),
  body('category_id').optional().isInt({ min: 1 }).withMessage('Categoría inválida'),
  body('brand_id').optional().isInt({ min: 1 }).withMessage('Marca inválida'),
  body('image').optional().isURL().withMessage('Imagen debe ser una URL válida'),
  body('keywords').optional().isLength({ max: 500 }).withMessage('Keywords no pueden exceder 500 caracteres'),
  body('seo_title').optional().isLength({ max: 160 }).withMessage('SEO title no puede exceder 160 caracteres'),
  body('seo_description').optional().isLength({ max: 300 }).withMessage('SEO description no puede exceder 300 caracteres'),
  body('component_type').optional().isString().withMessage('Tipo de componente inválido'),
  body('additional_images').optional().isArray().withMessage('Imágenes adicionales deben ser un array'),
  body('additional_images.*').optional().isURL().withMessage('URL de imagen adicional inválida'),
  body('subcategory_ids').optional().isArray().withMessage('IDs de subcategorías deben ser un array'),
  body('subcategory_ids.*').optional().isInt().withMessage('ID de subcategoría debe ser un entero'),
], validateRequest, productController.createProduct.bind(productController));

// PUT actualizar producto
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('name').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ min: 1, max: 50000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
], validateRequest, productController.updateProduct.bind(productController));

// PATCH toggle active
router.patch('/:id/toggle-active', [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, productController.toggleActive.bind(productController));

// DELETE eliminar producto
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, productController.deleteProduct.bind(productController));

// PATCH bulk update
router.patch('/bulk-update', [
  body('product_ids').isArray({ min: 1 }).withMessage('Se requiere un array de IDs de productos'),
  body('product_ids.*').isInt().withMessage('IDs de productos deben ser enteros'),
], validateRequest, productController.bulkUpdate.bind(productController));

// POST sync-all - Sincronizar todos los productos con el ERP
router.post('/sync-all', productController.syncAll.bind(productController));

export default router;
