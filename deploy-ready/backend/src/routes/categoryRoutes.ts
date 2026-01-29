import express from 'express';
import { Category } from '../models/Category';
import { cacheMiddleware } from '../middleware/cache';

console.log('🔍 Category routes module loaded');

const router = express.Router();

// Cache for 10 minutes (600 seconds) for categories
const categoryCache = cacheMiddleware('categories', 600);

// Middleware para loggear todas las solicitudes
router.use((req, res, next) => {
  console.log(`🔍 Category route accessed: ${req.method} ${req.url}`);
  next();
});

// Ruta de health check específica para verificar que las rutas están funcionando
router.get('/health-check', (req, res) => {
  console.log('✅ Health check endpoint called');
  res.json({
    success: true,
    message: "Category routes working!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/categories/health-check",
  });
});

// GET todas las categorías (with cache)
router.get('/', categoryCache, async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug', 'appears_in_menu', 'created_at', 'updated_at'],
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET categorías del menú (with cache)
router.get('/menu', categoryCache, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { appears_in_menu: true },
      attributes: ['id', 'name', 'slug', 'appears_in_menu', 'created_at', 'updated_at'],
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener categorías del menú' });
  }
});

// GET categoría por slug (with cache)
router.get('/:slug', categoryCache, async (req, res) => {
  try {
    // Verificar si es health-check y devolver respuesta específica
    if (req.params.slug === 'health-check') {
      console.log('✅ Health check via slug endpoint called');
      return res.json({
        success: true,
        message: "Category routes working!",
        timestamp: new Date().toISOString(),
        endpoint: "/api/categories/health-check",
      });
    }

    let category;
    const { SubCategory } = require('../models/SubCategory');

    // Check if the param is a number (ID) or string (slug)
    // The admin panel uses ID to fetch categories for the product form
    if (!isNaN(Number(req.params.slug))) {
      category = await Category.findByPk(req.params.slug, {
        attributes: ['id', 'name', 'slug', 'appears_in_menu', 'created_at', 'updated_at'],
        include: [{
          model: SubCategory,
          as: 'subcategories',
          attributes: ['id', 'name', 'slug', 'is_active'],
          where: { is_active: true },
          required: false
        }]
      });
    } else {
      category = await Category.findOne({
        where: { slug: req.params.slug },
        attributes: ['id', 'name', 'slug', 'appears_in_menu', 'created_at', 'updated_at'],
        include: [{
          model: SubCategory,
          as: 'subcategories',
          attributes: ['id', 'name', 'slug', 'is_active'],
          where: { is_active: true },
          required: false
        }]
      });
    }

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Map subcategories to camelCase for consistency with frontend
    const result = category.toJSON() as any;
    if (result.subcategories) {
      result.subCategories = result.subcategories;
      // delete result.subcategories; // Optional: keep both for backward compat
    }

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

export default router;