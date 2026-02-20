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
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al obtener marcas' });
  }
});

// GET marcas para carrusel de logos
router.get('/carousel', async (req, res) => {
  try {
    const { Op } = await import('sequelize');
    const brands = await Brand.findAll({
      where: { show_in_carousel: true, logo: { [Op.ne]: null } },
      attributes: ['id', 'name', 'slug', 'logo'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error carousel brands:', error);
    res.status(500).json({ success: false, error: 'Error al obtener marcas del carrusel' });
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