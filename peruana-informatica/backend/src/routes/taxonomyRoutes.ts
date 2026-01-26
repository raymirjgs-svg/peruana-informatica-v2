import { Router } from 'express';
import { TaxonomyController } from '../controllers/TaxonomyController';

const router = Router();

/**
 * @route POST /api/taxonomy/assign
 * @desc Asigna marca, categoría y subcategorías a un producto
 * @body { productId?: number, codigoInterno?: string, brandName?: string, categoryName?: string, subCategoryNames?: string[] }
 * @access Private
 */
router.post('/assign', TaxonomyController.assignTaxonomy);

/**
 * @route POST /api/taxonomy/bulk-assign
 * @desc Asigna taxonomía a múltiples productos
 * @body { products: Array<{ productId?, codigoInterno?, brandName?, categoryName?, subCategoryNames? }> }
 * @access Private
 */
router.post('/bulk-assign', TaxonomyController.bulkAssignTaxonomy);

/**
 * @route GET /api/taxonomy/brands
 * @desc Obtiene todas las marcas disponibles
 * @access Public
 */
router.get('/brands', TaxonomyController.getBrands);

/**
 * @route GET /api/taxonomy/categories
 * @desc Obtiene todas las categorías disponibles
 * @access Public
 */
router.get('/categories', TaxonomyController.getCategories);

/**
 * @route GET /api/taxonomy/subcategories
 * @desc Obtiene todas las subcategorías (opcional: filtrar por category_id)
 * @query category_id - ID de categoría para filtrar (opcional)
 * @access Public
 */
router.get('/subcategories', TaxonomyController.getSubCategories);

/**
 * @route POST /api/taxonomy/sync-from-api/:codigoInterno
 * @desc Sincroniza taxonomía de un producto desde datos de API externa
 * @param codigoInterno - Código interno del producto
 * @body { apiData: any }
 * @access Private
 */
router.post('/sync-from-api/:codigoInterno', TaxonomyController.syncFromAPI);

export default router;
