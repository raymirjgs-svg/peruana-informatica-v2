import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { ProductTaxonomyService } from '../services/ProductTaxonomyService';
import { buildPaginationMeta, getSafetyLimit, resolvePagination } from '../utils/pagination';
import { sendError } from '../middleware/errorHandler';

/**
 * Controlador para gestionar marcas, categorías y subcategorías de productos
 */
interface BulkTaxonomyItem {
    productId?: number;
    codigoInterno?: string;
    brandName?: string;
    categoryName?: string;
    subCategoryNames?: string[];
}

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
        } catch (error) {
            return sendError(res, error, 'Error al asignar taxonomía');
        }
    }

    /**
     * POST /api/taxonomy/bulk-assign
     * Asigna taxonomía a múltiples productos
     */
    static async bulkAssignTaxonomy(req: Request, res: Response) {
        try {
            const { products, productIds, brandName, categoryName, subCategoryNames } = req.body;

            let items: BulkTaxonomyItem[] = [];

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
                } catch {
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
        } catch (error) {
            return sendError(res, error, 'Error en asignación masiva');
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
        } catch (error) {
            return sendError(res, error, 'Error al obtener marcas');
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
        } catch (error) {
            return sendError(res, error, 'Error al obtener categorías');
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
        } catch (error) {
            return sendError(res, error, 'Error al obtener subcategorías');
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
        } catch (error) {
            return sendError(res, error, 'Error al sincronizar taxonomía desde API');
        }
    }

    // ============ CATEGORÍAS ============

    /**
     * GET /api/admin/taxonomy/categories
     * Obtiene todas las categorías con sus subcategorías (paginado)
     */
    static async getAllCategories(req: Request, res: Response) {
        try {
            const { page, limit, offset, paginated } = resolvePagination(req.query);
            const include = [{
                model: SubCategory,
                as: 'subcategories',
                where: { is_active: true },
                required: false,
                order: [['order', 'ASC']] as [string, string][]
            }];

            if (paginated) {
                const { rows, count } = await Category.findAndCountAll({
                    include,
                    order: [['name', 'ASC']],
                    limit,
                    offset
                });
                return res.json({
                    success: true,
                    data: rows,
                    pagination: buildPaginationMeta(page, limit, count)
                });
            }

            const categories = await Category.findAll({
                include,
                order: [['name', 'ASC']],
                limit: getSafetyLimit(limit)
            });

            res.json(categories);
        } catch (error) {
            return sendError(res, error, 'Error al obtener categorías', 500, 'CATEGORIES_FETCH_ERROR');
        }
    }

    /**
     * POST /api/admin/taxonomy/categories
     * Crea una nueva categoría
     */
    static async createCategory(req: Request, res: Response) {
        try {
            const { name, slug, appears_in_menu, seo_title, seo_description } = req.body;

            // Verificar si ya existe
            const existing = await Category.findOne({ where: { slug } });
            if (existing) {
                return res.status(400).json({
                    error: 'Ya existe una categoría con ese slug',
                    code: 'DUPLICATE_SLUG'
                });
            }

            const category = await Category.create({
                name,
                slug,
                appears_in_menu: appears_in_menu !== undefined ? appears_in_menu : true,
                seo_title,
                seo_description
            });

            res.status(201).json({
                message: 'Categoría creada exitosamente',
                category
            });
        } catch (error) {
            return sendError(res, error, 'Error al crear categoría', 500, 'CATEGORY_CREATE_ERROR');
        }
    }

    /**
     * PUT /api/admin/taxonomy/categories/:id
     * Actualiza una categoría
     */
    static async updateCategory(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const { name, slug, appears_in_menu, seo_title, seo_description } = req.body;

            const category = await Category.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            // Si se está actualizando el slug, verificar que no exista
            if (slug && slug !== category.slug) {
                const existing = await Category.findOne({ where: { slug } });
                if (existing) {
                    return res.status(400).json({
                        error: 'Ya existe una categoría con ese slug',
                        code: 'DUPLICATE_SLUG'
                    });
                }
            }

            await category.update({
                ...(name && { name }),
                ...(slug && { slug }),
                ...(appears_in_menu !== undefined && { appears_in_menu }),
                ...(seo_title !== undefined && { seo_title }),
                ...(seo_description !== undefined && { seo_description }),
            });

            res.json({
                message: 'Categoría actualizada exitosamente',
                category
            });
        } catch (error) {
            return sendError(res, error, 'Error al actualizar categoría', 500, 'CATEGORY_UPDATE_ERROR');
        }
    }

    /**
     * DELETE /api/admin/taxonomy/categories/:id
     * Elimina una categoría
     */
    static async deleteCategory(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);

            const category = await Category.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            // Verificar si tiene subcategorías
            const subcategoriesCount = await SubCategory.count({
                where: { category_id: id, is_active: true }
            });

            if (subcategoriesCount > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar. Esta categoría tiene ${subcategoriesCount} subcategoría${subcategoriesCount !== 1 ? 's' : ''} activa${subcategoriesCount !== 1 ? 's' : ''}`,
                    code: 'CATEGORY_HAS_SUBCATEGORIES'
                });
            }

            await category.destroy();

            res.json({
                message: 'Categoría eliminada exitosamente'
            });
        } catch (error) {
            return sendError(res, error, 'Error al eliminar categoría', 500, 'CATEGORY_DELETE_ERROR');
        }
    }

    // ============ SUBCATEGORÍAS ============

    /**
     * GET /api/admin/taxonomy/subcategories
     * Obtiene todas las subcategorías (paginado, filtro opcional por categoría)
     */
    static async getAllSubCategories(req: Request, res: Response) {
        try {
            const { category_id } = req.query;

            const where: { is_active: boolean; category_id?: number } = { is_active: true };
            if (category_id) {
                where.category_id = parseInt(category_id as string);
            }

            const { page, limit, offset, paginated } = resolvePagination(req.query);
            const include = [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }];
            const order: [string, string][] = [['order', 'ASC'], ['name', 'ASC']];

            if (paginated) {
                const { rows, count } = await SubCategory.findAndCountAll({
                    where,
                    include,
                    order,
                    limit,
                    offset
                });
                return res.json({
                    success: true,
                    data: rows,
                    pagination: buildPaginationMeta(page, limit, count)
                });
            }

            const subcategories = await SubCategory.findAll({
                where,
                include,
                order,
                limit: getSafetyLimit(limit)
            });

            res.json(subcategories);
        } catch (error) {
            return sendError(res, error, 'Error al obtener subcategorías', 500, 'SUBCATEGORIES_FETCH_ERROR');
        }
    }

    /**
     * POST /api/admin/taxonomy/subcategories
     * Crea una nueva subcategoría
     */
    static async createSubCategory(req: Request, res: Response) {
        try {
            const { name, slug, category_id, order = 0, description } = req.body;

            // Verificar que la categoría existe
            const category = await Category.findByPk(category_id);
            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            // Verificar si ya existe una subcategoría con el mismo slug
            const existing = await SubCategory.findOne({ where: { slug } });
            if (existing) {
                return res.status(400).json({
                    error: 'Ya existe una subcategoría con ese slug',
                    code: 'DUPLICATE_SLUG'
                });
            }

            const subcategory = await SubCategory.create({
                name,
                slug,
                category_id,
                order,
                description,
                is_active: true
            });

            // Obtener la subcategoría con la categoría incluida
            const subcategoryWithCategory = await SubCategory.findByPk(subcategory.id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'slug']
                }]
            });

            res.status(201).json({
                message: 'Subcategoría creada exitosamente',
                subcategory: subcategoryWithCategory
            });
        } catch (error) {
            return sendError(res, error, 'Error al crear subcategoría', 500, 'SUBCATEGORY_CREATE_ERROR');
        }
    }

    /**
     * PUT /api/admin/taxonomy/subcategories/:id
     * Actualiza una subcategoría
     */
    static async updateSubCategory(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const { name, slug, category_id, order, description, is_active } = req.body;

            const subcategory = await SubCategory.findByPk(id);
            if (!subcategory) {
                return res.status(404).json({
                    error: 'Subcategoría no encontrada',
                    code: 'SUBCATEGORY_NOT_FOUND'
                });
            }

            // Si se está cambiando la categoría, verificar que existe
            if (category_id && category_id !== subcategory.category_id) {
                const category = await Category.findByPk(category_id);
                if (!category) {
                    return res.status(404).json({
                        error: 'Categoría no encontrada',
                        code: 'CATEGORY_NOT_FOUND'
                    });
                }
            }

            // Si se está actualizando el slug, verificar que no exista
            if (slug && slug !== subcategory.slug) {
                const existing = await SubCategory.findOne({ where: { slug } });
                if (existing) {
                    return res.status(400).json({
                        error: 'Ya existe una subcategoría con ese slug',
                        code: 'DUPLICATE_SLUG'
                    });
                }
            }

            await subcategory.update({
                ...(name && { name }),
                ...(slug && { slug }),
                ...(category_id && { category_id }),
                ...(order !== undefined && { order }),
                ...(description !== undefined && { description }),
                ...(is_active !== undefined && { is_active }),
            });

            // Obtener la subcategoría actualizada con la categoría
            const updatedSubcategory = await SubCategory.findByPk(id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'slug']
                }]
            });

            res.json({
                message: 'Subcategoría actualizada exitosamente',
                subcategory: updatedSubcategory
            });
        } catch (error) {
            return sendError(res, error, 'Error al actualizar subcategoría', 500, 'SUBCATEGORY_UPDATE_ERROR');
        }
    }

    /**
     * DELETE /api/admin/taxonomy/subcategories/:id
     * Elimina una subcategoría (soft delete)
     */
    static async deleteSubCategory(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);

            const subcategory = await SubCategory.findByPk(id);
            if (!subcategory) {
                return res.status(404).json({
                    error: 'Subcategoría no encontrada',
                    code: 'SUBCATEGORY_NOT_FOUND'
                });
            }

            // Soft delete
            await subcategory.update({ is_active: false });

            res.json({
                message: 'Subcategoría eliminada exitosamente'
            });
        } catch (error) {
            return sendError(res, error, 'Error al eliminar subcategoría', 500, 'SUBCATEGORY_DELETE_ERROR');
        }
    }
}
