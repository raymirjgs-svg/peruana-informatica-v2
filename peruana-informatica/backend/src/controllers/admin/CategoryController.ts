import { Request, Response } from 'express';
import { Category } from '../../models/Category';
import { Product } from '../../models/Product';
import { Op } from 'sequelize';
import { logger } from '../../config/logger';
import { sendError } from '../../middleware/errorHandler';

export class CategoryController {
    /**
     * GET /api/admin/categories
     * Obtiene todas las categorías con conteo de productos
     */
    static async getAll(req: Request, res: Response) {
        try {
            const categories = await Category.findAll({
                order: [['name', 'ASC']],
                include: [
                    {
                        model: Product,
                        as: 'products',
                        attributes: ['id'],
                    }
                ]
            });

            const categoriesWithCount = categories.map((category: any) => ({
                ...category.toJSON(),
                productCount: category.products?.length || 0
            }));

            res.json(categoriesWithCount);
        } catch (error) {
            logger.error('Error getting categories:', error);
            return sendError(res, error, 'Error al obtener categorías', 500, 'CATEGORIES_FETCH_ERROR');
        }
    }

    /**
     * GET /api/admin/categories/menu
     * Obtiene categorías para el menú (frontend)
     */
    static async getMenu(req: Request, res: Response) {
        try {
            const categories = await Category.findAll({
                where: { appears_in_menu: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'slug']
            });

            res.json(categories);
        } catch (error) {
            logger.error('Error getting menu categories:', error);
            return sendError(res, error, 'Error al obtener categorías del menú', 500, 'MENU_CATEGORIES_ERROR');
        }
    }

    /**
     * GET /api/admin/categories/:id
     * Obtiene una categoría por ID con sus productos
     */
    static async getById(req: Request, res: Response) {
        try {
            const category = await Category.findByPk(req.params.id, {
                include: [
                    {
                        model: Product,
                        as: 'products',
                        attributes: ['id', 'name', 'price', 'stock'],
                    }
                ]
            });

            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            res.json(category);
        } catch (error) {
            logger.error('Error getting category:', error);
            return sendError(res, error, 'Error al obtener categoría', 500, 'CATEGORY_FETCH_ERROR');
        }
    }

    /**
     * POST /api/admin/categories
     * Crea una nueva categoría (genera slug único)
     */
    static async create(req: Request, res: Response) {
        try {
            const { name, appears_in_menu = true } = req.body;

            // Generar slug único
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let counter = 1;

            while (await Category.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            const category = await Category.create({
                name,
                slug,
                appears_in_menu,
                seo_title: req.body.seo_title ?? null,
                seo_description: req.body.seo_description ?? null,
            });

            res.status(201).json(category);
        } catch (error) {
            logger.error('Error creating category:', error);
            return sendError(res, error, 'Error al crear categoría', 500, 'CATEGORY_CREATE_ERROR');
        }
    }

    /**
     * PUT /api/admin/categories/:id
     * Actualiza una categoría (regenera slug si cambia el nombre)
     */
    static async update(req: Request, res: Response) {
        try {
            const category = await Category.findByPk(req.params.id);

            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            const allowedFields = ['name', 'appears_in_menu', 'seo_title', 'seo_description'];
            const updateData: any = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });

            // Si se actualiza el nombre, generar nuevo slug
            if (req.body.name && req.body.name !== category.name) {
                const baseSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                let slug = baseSlug;
                let counter = 1;

                while (await Category.findOne({
                    where: {
                        slug,
                        id: { [Op.ne]: category.id }
                    }
                })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                updateData.slug = slug;
            }

            await category.update(updateData);

            res.json(category);
        } catch (error) {
            logger.error('Error updating category:', error);
            return sendError(res, error, 'Error al actualizar categoría', 500, 'CATEGORY_UPDATE_ERROR');
        }
    }

    /**
     * DELETE /api/admin/categories/:id
     * Elimina una categoría (verifica productos asociados)
     */
    static async delete(req: Request, res: Response) {
        try {
            const category = await Category.findByPk(req.params.id);

            if (!category) {
                return res.status(404).json({
                    error: 'Categoría no encontrada',
                    code: 'CATEGORY_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar si hay productos asociados
            const productCount = await Product.count({ where: { category_id: category.id } });

            if (productCount > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar la categoría porque tiene ${productCount} productos asociados`,
                    code: 'CATEGORY_HAS_PRODUCTS',
                    timestamp: new Date().toISOString()
                });
            }

            await category.destroy();

            res.json({
                message: 'Categoría eliminada correctamente',
                id: category.id
            });
        } catch (error) {
            logger.error('Error deleting category:', error);
            return sendError(res, error, 'Error al eliminar categoría', 500, 'CATEGORY_DELETE_ERROR');
        }
    }
}