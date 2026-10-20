import { Request, Response } from 'express';
import { ProductTaxonomyService } from '../services/ProductTaxonomyService';

/**
 * Controlador para gestionar marcas, categorías y subcategorías de productos
 */
export class TaxonomyController {
    /**
     * POST /api/taxonomy/assign
     * Asigna marca, categoría y subcategorías a un producto
     */
    static async assignTaxonomy(req: Request, res: Response) {
        try {
            const { productId, codigoInterno, brandName, categoryName, subCategoryNames } = req.body;

            if (!productId && !codigoInterno) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere productId o codigoInterno'
                });
            }

            let producto;

            if (codigoInterno) {
                producto = await ProductTaxonomyService.assignTaxonomyByCode(
                    codigoInterno,
                    brandName,
                    categoryName,
                    subCategoryNames
                );
            } else {
                producto = await ProductTaxonomyService.assignTaxonomy(
                    productId,
                    brandName,
                    categoryName,
                    subCategoryNames
                );
            }

            return res.json({
                success: true,
                message: 'Taxonomía asignada exitosamente',
                data: producto
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.assignTaxonomy:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al asignar taxonomía',
                error: 'Error al procesar la taxonomía'
            });
        }
    }

    /**
     * POST /api/taxonomy/bulk-assign
     * Asigna taxonomía a múltiples productos
     */
    static async bulkAssignTaxonomy(req: Request, res: Response) {
        try {
            const { products, productIds, brandName, categoryName, subCategoryNames } = req.body;

            let items: any[] = [];

            if (Array.isArray(products) && products.length > 0) {
                items = products;
            } else if (Array.isArray(productIds) && productIds.length > 0) {
                items = productIds.map((productId: number) => ({
                    productId,
                    brandName,
                    categoryName,
                    subCategoryNames
                }));
            }

            if (items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de productos con sus taxonomías o una lista de productIds'
                });
            }

            const resultados = [];
            const errores = [];

            for (const item of items) {
                try {
                    const { productId, codigoInterno, brandName, categoryName, subCategoryNames } = item;

                    let producto;
                    if (codigoInterno) {
                        producto = await ProductTaxonomyService.assignTaxonomyByCode(
                            codigoInterno,
                            brandName,
                            categoryName,
                            subCategoryNames
                        );
                    } else if (productId) {
                        producto = await ProductTaxonomyService.assignTaxonomy(
                            productId,
                            brandName,
                            categoryName,
                            subCategoryNames
                        );
                    }

                    resultados.push({
                        success: true,
                        productId: productId || codigoInterno,
                        data: producto
                    });
                } catch (error: any) {
                    errores.push({
                        success: false,
                        productId: item.productId || item.codigoInterno,
                        error: 'Error al procesar la taxonomía'
                    });
                }
            }

            return res.json({
                success: true,
                message: `Asignación masiva completada: ${resultados.length}/${items.length} exitosos`,
                data: {
                    total: items.length,
                    count: resultados.length,
                    exitosos: resultados.length,
                    fallidos: errores.length,
                    detalles: {
                        exitosos: resultados,
                        errores
                    }
                }
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.bulkAssignTaxonomy:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en asignación masiva',
                error: 'Error al procesar la taxonomía'
            });
        }
    }

    /**
     * GET /api/taxonomy/brands
     * Obtiene todas las marcas
     */
    static async getBrands(req: Request, res: Response) {
        try {
            const brands = await ProductTaxonomyService.getAllBrands();

            return res.json({
                success: true,
                data: brands,
                total: brands.length
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.getBrands:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener marcas',
                error: 'Error al procesar la taxonomía'
            });
        }
    }

    /**
     * GET /api/taxonomy/categories
     * Obtiene todas las categorías
     */
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await ProductTaxonomyService.getAllCategories();

            return res.json({
                success: true,
                data: categories,
                total: categories.length
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.getCategories:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener categorías',
                error: 'Error al procesar la taxonomía'
            });
        }
    }

    /**
     * GET /api/taxonomy/subcategories
     * Obtiene todas las subcategorías (con filtro opcional por categoría)
     */
    static async getSubCategories(req: Request, res: Response) {
        try {
            const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
            const subCategories = await ProductTaxonomyService.getAllSubCategories(categoryId);

            return res.json({
                success: true,
                data: subCategories,
                total: subCategories.length
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.getSubCategories:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener subcategorías',
                error: 'Error al procesar la taxonomía'
            });
        }
    }

    /**
     * POST /api/taxonomy/sync-from-api/:codigoInterno
     * Sincroniza taxonomía desde datos de la API externa
     */
    static async syncFromAPI(req: Request, res: Response) {
        try {
            const { codigoInterno } = req.params;
            const { apiData } = req.body;

            if (!apiData) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren los datos de la API (apiData)'
                });
            }

            const producto = await ProductTaxonomyService.syncTaxonomyFromAPI(apiData, codigoInterno || '');

            return res.json({
                success: true,
                message: 'Taxonomía sincronizada desde API externa',
                data: producto
            });
        } catch (error: any) {
            console.error('Error en TaxonomyController.syncFromAPI:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al sincronizar taxonomía desde API',
                error: 'Error al procesar la taxonomía'
            });
        }
    }
}
