import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Category } from '../../models/Category';
import { Product } from '../../models/Product';

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

// GET todas las categorías
router.get('/', async (req: Request, res: Response) => {
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

    // Agregar conteo de productos
    const categoriesWithCount = categories.map(category => ({
      ...category.toJSON(),
      productCount: category.products?.length || 0
    }));

    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ 
      error: 'Error al obtener categorías',
      code: 'CATEGORIES_FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET categorías para menú
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll({
      where: { appears_in_menu: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'slug']
    });

    res.json(categories);
  } catch (error) {
    console.error('Error getting menu categories:', error);
    res.status(500).json({ 
      error: 'Error al obtener categorías del menú',
      code: 'MENU_CATEGORIES_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET categoría por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, async (req: Request, res: Response) => {
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
    console.error('Error getting category:', error);
    res.status(500).json({ 
      error: 'Error al obtener categoría',
      code: 'CATEGORY_FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// POST crear categoría
router.post('/', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Nombre es requerido y debe tener entre 1 y 100 caracteres'),
  body('appears_in_menu').optional().isBoolean().withMessage('appears_in_menu debe ser un booleano'),
  body('seo_title').optional().isLength({ max: 160 }).withMessage('SEO title no puede exceder 160 caracteres'),
  body('seo_description').optional().isLength({ max: 300 }).withMessage('SEO description no puede exceder 300 caracteres'),
], validateRequest, async (req: Request, res: Response) => {
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
    console.error('Error creating category:', error);
    res.status(500).json({ 
      error: 'Error al crear categoría',
      code: 'CATEGORY_CREATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT actualizar categoría
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Nombre debe tener entre 1 y 100 caracteres'),
  body('appears_in_menu').optional().isBoolean().withMessage('appears_in_menu debe ser un booleano'),
  body('seo_title').optional().isLength({ max: 160 }).withMessage('SEO title no puede exceder 160 caracteres'),
  body('seo_description').optional().isLength({ max: 300 }).withMessage('SEO description no puede exceder 300 caracteres'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Categoría no encontrada',
        code: 'CATEGORY_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const updateData: any = { ...req.body };
    
    // Si se actualiza el nombre, generar nuevo slug
    if (req.body.name && req.body.name !== category.name) {
      const baseSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug;
      let counter = 1;
      
      while (await Category.findOne({ where: { slug, id: { [require('sequelize').Op.ne]: category.id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    await category.update(updateData);

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      error: 'Error al actualizar categoría',
      code: 'CATEGORY_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE eliminar categoría
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, async (req: Request, res: Response) => {
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
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Error al eliminar categoría',
      code: 'CATEGORY_DELETE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
