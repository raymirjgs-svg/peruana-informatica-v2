// ============================================
// backend/src/routes/productRoutes.ts
// ============================================
import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Image } from '../models/Image';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';
import { searchRateLimit } from '../middleware/security';
import { SyncService } from '../services/SyncService';

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

// GET todos los productos con filtros y paginación
// GET /suggestions - Autocomplete endpoint (Must be defined check before generic /:id or /)
router.get('/utils/suggestions', searchRateLimit, [
  query('q').isLength({ min: 1, max: 100 }).withMessage('Query required'),
  query('limit').optional().isInt({ max: 10 }).withMessage('Limit max 10')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;
    const searchTerms = q.trim().split(/\s+/).filter(t => t.length > 0);

    if (searchTerms.length === 0) return res.json([]);

    // Simple robust search for suggestions - prioritized by name
    const products = await Product.findAll({
      where: {
        is_active: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { category: { [Op.like]: `%${q}%` } },
          { brand_id: { [Op.in]: sequelize.literal(`(SELECT id FROM brands WHERE name LIKE '%${q}%')`) } }
        ]
      },
      attributes: ['cod_producto', 'name', 'slug', 'image', 'category', 'price', 'price_dis', 'price_web', 'price_cot'],
      limit: limit,
      order: [
        // Prioritize exact start of name
        [sequelize.literal(`CASE WHEN name LIKE '${q}%' THEN 1 ELSE 2 END`), 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json(products);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Suggestion error' });
  }
});

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
], validateRequest, async (req: Request, res: Response) => {
  try {
    // Trigger automatic sync (non-blocking)
    SyncService.syncProducts().catch(err => console.error('Background sync error:', err));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    // Filtros
    const categorySlug = req.query.category as string;
    const brandSlug = req.query.brand as string;
    const search = req.query.search as string;

    // Construir where clause basic
    const where: any = {
      is_active: 1,  // Solo productos activos en el frontend público
      stock: { [Op.gt]: 0 } // Solo mostrar productos con stock positivo real
    };

    // Filtro por categoría
    if (categorySlug) {
      const category = await Category.findOne({ where: { slug: categorySlug } });
      if (category) {
        where.category_id = category.id;
      }
    }

    // Filtro por marca
    if (brandSlug) {
      const brand = await Brand.findOne({ where: { slug: brandSlug } });
      if (brand) {
        where.brand_id = brand.id;
      }
    }

    // Filtros especiales (Featured, New, Clearance)
    if (req.query.featured === 'true') where.is_featured = true;
    if (req.query.new === 'true') where.is_new = true;
    if (req.query.clearance === 'true') where.is_clearance = true;

    // Advanced Search Logic "Amazon-like"
    let order: any = [['cod_producto', 'DESC']]; // Default

    if (search) {
      const cleanSearch = search.trim();
      const searchTerms = cleanSearch.split(/\s+/).filter(t => t.length > 0);

      // 1. Where Clause Construction
      // We want to find matches in Name, Code, Keywords, Brand, Category
      const searchConditions = [];

      // Exact ID or Code Match (High precision)
      searchConditions.push({ codigo_interno: cleanSearch });

      // Name & Description partial matches
      searchConditions.push({ name: { [Op.like]: `%${cleanSearch}%` } });
      searchConditions.push({ description: { [Op.like]: `%${cleanSearch}%` } });
      searchConditions.push({ keywords: { [Op.like]: `%${cleanSearch}%` } });

      // Also match individual terms if it's a multi-word search
      if (searchTerms.length > 1) {
        const termConditions = searchTerms.map(term => ({
          [Op.or]: [
            { name: { [Op.like]: `%${term}%` } },
            { description: { [Op.like]: `%${term}%` } },
            { keywords: { [Op.like]: `%${term}%` } }
          ]
        }));
        // Use [Op.and] to require all terms to be present somewhere in the record for "smart" search
        // OR loosen it to [Op.or] if you want broad results. "Amazon" usually defaults to AND for keywords.
        searchConditions.push({ [Op.and]: termConditions });
      }

      where[Op.or] = searchConditions;

      // 2. Relevance Sorting (The "Amazon" Magic)
      // We inject a calculated field or just order by a complex CASE statement
      // CASE 
      //   WHEN codigo_interno = 'search' THEN 1  (Exact Code)
      //   WHEN name LIKE 'search' THEN 2         (Exact Name)
      //   WHEN name LIKE 'search%' THEN 3        (Starts With)
      //   WHEN name LIKE '%search%' THEN 4       (Contains Name)
      //   ELSE 5                                 (Description/Other)
      // END

      // Note: literal requires careful escaping. For simplicity/safety with sequelize queries, we use basic sanitization.
      const safeSearch = cleanSearch.replace(/'/g, "\\'");

      order = [
        [sequelize.literal(`
          CASE 
            WHEN Product.codigo_interno = '${safeSearch}' THEN 1
            WHEN Product.name LIKE '${safeSearch}' THEN 2
            WHEN Product.name LIKE '${safeSearch}%' THEN 3
            WHEN Product.name LIKE '%${safeSearch}%' THEN 4
            ELSE 5 
          END`), 'ASC'],
        ['is_featured', 'DESC'], // Boost featured items among similar relevance
        ['stock', 'DESC']        // Boost in-stock items
      ];
    }

    // Other filters...
    if (req.query.component_type) where.component_type = req.query.component_type;

    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) where.price = { [Op.between]: [minPrice, maxPrice] };
    else if (!isNaN(minPrice)) where.price = { [Op.gte]: minPrice };
    else if (!isNaN(maxPrice)) where.price = { [Op.lte]: maxPrice };

    if (req.query.ids) {
      const ids = (req.query.ids as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) where.cod_producto = { [Op.in]: ids };
    }

    // Override order if explicit sort requested
    if (req.query.sort) {
      // Keep relevance as primary for search if user didn't pick "Lowest Price" etc? 
      // Usually, if user explicitly sorts, that overrides relevance.
      // But if sort is 'relevance' (default), we use our computed order.
      const sort = req.query.sort as string;
      switch (sort) {
        case 'price_asc': order = [['price', 'ASC']]; break;
        case 'price_desc': order = [['price', 'DESC']]; break;
        case 'name_asc': order = [['name', 'ASC']]; break;
        case 'name_desc': order = [['name', 'DESC']]; break;
        case 'newest': order = [['cod_producto', 'DESC']]; break;
        // default is kept as computed above
      }
    }

    console.log('🔍 Public Products Query:', { whereQueryKeys: Object.keys(where), limit, offset });

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: [
        'cod_producto', 'name', 'slug', 'description', 'short_description', 'price', 'price_web', 'price_cot', 'price_dis', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'estado', 'codigo_interno',
        'component_type', 'socket_type', 'ram_type', 'form_factor', 'tdp_watts', 'has_integrated_graphics', 'component_specs', 'is_featured', 'is_new', 'is_clearance'
      ],
      include: [
        { model: Brand, as: 'productBrand', attributes: ['id', 'name', 'slug'], required: false },
        { model: Category, as: 'productCategory', attributes: ['id', 'name', 'slug'], required: false },
        { model: Image, as: 'images', attributes: ['cod_galeria', 'codigo_interno', 'imagen'], required: false }
      ]
    });

    res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: { category: categorySlug || null, brand: brandSlug || null, search: search || null }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener productos',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET producto por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({
      where: {
        cod_producto: req.params.id,
        is_active: 1  // Solo productos activos
      },
      attributes: [
        'cod_producto', 'name', 'slug', 'description', 'short_description', 'price', 'price_web', 'price_cot', 'price_dis', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'estado', 'codigo_interno',
        'component_type', 'socket_type', 'ram_type', 'form_factor', 'tdp_watts', 'has_integrated_graphics', 'component_specs'
      ],

      include: [
        {
          model: Brand,
          as: 'productBrand',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'productCategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Image,
          as: 'images',
          attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
          required: false,
        }
      ]
    });
    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener producto',
      code: 'PRODUCT_FETCH_ERROR',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET producto por slug
router.get('/slug/:slug', [
  param('slug').isLength({ min: 1, max: 255 }).withMessage('Slug inválido'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({
      where: {
        slug: req.params.slug,
        is_active: 1  // Solo productos activos
      },
      attributes: [
        'cod_producto', 'name', 'slug', 'description', 'short_description', 'price', 'price_web', 'price_cot', 'price_dis', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'estado', 'codigo_interno',
        'component_type', 'socket_type', 'ram_type', 'form_factor', 'tdp_watts', 'has_integrated_graphics', 'component_specs'
      ],

      include: [
        {
          model: Brand,
          as: 'productBrand',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'productCategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Image,
          as: 'images',
          attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
          required: false,
        }
      ]
    });
    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener producto',
      code: 'PRODUCT_FETCH_ERROR',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;