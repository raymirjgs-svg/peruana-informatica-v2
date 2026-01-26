import express from 'express';
import { Brand } from '../models/Brand';

const router = express.Router();

// GET todas las marcas
router.get('/', async (req, res) => {
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
router.get('/:slug', async (req, res) => {
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