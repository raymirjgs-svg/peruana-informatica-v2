import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Category } from '../../models/Category';
import { SubCategory } from '../../models/SubCategory';
import { Op } from 'sequelize';

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

// ============ CATEGORÍAS ============

// GET todas las categorías con sus subcategorías
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const categories = await Category.findAll({
            include: [{
                model: SubCategory,
                as: 'subcategories',
                where: { is_active: true },
                required: false,
                order: [['order', 'ASC']]
            }],
            order: [['name', 'ASC']]
        });

        res.json(categories);
    } catch (error: any) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            error: 'Error al obtener categorías',
            code: 'CATEGORIES_FETCH_ERROR',
            details: error.message,
            stack: error.stack
        });
    }
});

// POST crear nueva categoría
router.post('/categories', [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('slug').trim().notEmpty().withMessage('El slug es requerido'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error creating category:', error);
        res.status(500).json({
            error: 'Error al crear categoría',
            code: 'CATEGORY_CREATE_ERROR'
        });
    }
});

// PUT actualizar categoría
router.put('/categories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('slug').optional().trim().notEmpty().withMessage('El slug no puede estar vacío'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error updating category:', error);
        res.status(500).json({
            error: 'Error al actualizar categoría',
            code: 'CATEGORY_UPDATE_ERROR'
        });
    }
});

// DELETE eliminar categoría
router.delete('/categories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error deleting category:', error);
        res.status(500).json({
            error: 'Error al eliminar categoría',
            code: 'CATEGORY_DELETE_ERROR'
        });
    }
});

// ============ SUBCATEGORÍAS ============

// GET todas las subcategorías
router.get('/subcategories', async (req: Request, res: Response) => {
    try {
        const { category_id } = req.query;

        const where: any = { is_active: true };
        if (category_id) {
            where.category_id = parseInt(category_id as string);
        }

        const subcategories = await SubCategory.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [['order', 'ASC'], ['name', 'ASC']]
        });

        res.json(subcategories);
    } catch (error) {
        console.error('Error getting subcategories:', error);
        res.status(500).json({
            error: 'Error al obtener subcategorías',
            code: 'SUBCATEGORIES_FETCH_ERROR'
        });
    }
});

// POST crear nueva subcategoría
router.post('/subcategories', [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('slug').trim().notEmpty().withMessage('El slug es requerido'),
    body('category_id').isInt({ min: 1 }).withMessage('La categoría es requerida'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error creating subcategory:', error);
        res.status(500).json({
            error: 'Error al crear subcategoría',
            code: 'SUBCATEGORY_CREATE_ERROR'
        });
    }
});

// PUT actualizar subcategoría
router.put('/subcategories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('slug').optional().trim().notEmpty().withMessage('El slug no puede estar vacío'),
    body('category_id').optional().isInt({ min: 1 }).withMessage('ID de categoría inválido'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error updating subcategory:', error);
        res.status(500).json({
            error: 'Error al actualizar subcategoría',
            code: 'SUBCATEGORY_UPDATE_ERROR'
        });
    }
});

// DELETE eliminar subcategoría (soft delete)
router.delete('/subcategories/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
], validateRequest, async (req: Request, res: Response) => {
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
        console.error('Error deleting subcategory:', error);
        res.status(500).json({
            error: 'Error al eliminar subcategoría',
            code: 'SUBCATEGORY_DELETE_ERROR'
        });
    }
});

export default router;
