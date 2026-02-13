import express from 'express';
import { Brand } from '../models/Brand';
import { cacheMiddleware } from '../middleware/cache';

const router = express.Router();

const brandCache = cacheMiddleware('brands', 600);

// GET todas las marcas
router.get('/', brandCache, async (req, res) => {
  try {
    const brands = await Brand.findAll({
      attributes: ['id','name','slug','created_at','updated_at'],
      order: [['name', 'ASC']],
    });
    res.json(brands);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// GET marca por slug
router.get('/:slug', brandCache, async (req, res) => {
  try {
    const brand = await Brand.findOne({
      where: { slug: req.params.slug },
      attributes: ['id','name','slug','created_at','updated_at'],
    });
    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener marca' });
  }
});

export default router;