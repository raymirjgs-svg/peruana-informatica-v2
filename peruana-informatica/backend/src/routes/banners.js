// ============================================
// routes/banners.js - Rutas de banners
// ============================================
const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Obtener todos los banners activos (público)
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener banners', error: error.message });
  }
});

// Obtener todos los banners (admin - incluyendo inactivos)
router.get('/admin/all', async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener banners', error: error.message });
  }
});

// Obtener un banner por ID
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener banner', error: error.message });
  }
});

// Crear un nuevo banner (admin)
router.post('/', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear banner', error: error.message });
  }
});

// Actualizar un banner (admin)
router.put('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    res.json(banner);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar banner', error: error.message });
  }
});

// Eliminar un banner (admin)
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    res.json({ message: 'Banner eliminado exitosamente', banner });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar banner', error: error.message });
  }
});

// Cambiar el orden de los banners (admin)
router.patch('/reorder', async (req, res) => {
  try {
    const { banners } = req.body; // Array de { id, order }
    
    const updates = banners.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updates);
    
    res.json({ message: 'Orden actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al reordenar banners', error: error.message });
  }
});

module.exports = router;
