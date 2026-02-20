import { Router } from 'express';
import { Announcement } from '../../models/Announcement';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// GET todas las anuncios
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al obtener anuncios' });
  }
});

// POST crear anuncio
router.post('/', async (req, res) => {
  try {
    const { icon, text, order, is_active } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, error: 'El texto es requerido' });
    const announcement = await Announcement.create({ icon: icon || '📢', text: text.trim(), order: order ?? 0, is_active: is_active ?? true });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error POST announcements:', error);
    res.status(500).json({ success: false, error: 'Error al crear anuncio' });
  }
});

// PUT actualizar anuncio
router.put('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    const { icon, text, order, is_active } = req.body;
    if (text !== undefined && !text.trim()) return res.status(400).json({ success: false, error: 'El texto no puede estar vacío' });
    await announcement.update({ icon, text: text?.trim(), order, is_active });
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error PUT announcements:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar anuncio' });
  }
});

// PATCH toggle activo/inactivo
router.patch('/:id/toggle', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    await announcement.update({ is_active: !announcement.is_active });
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al cambiar estado' });
  }
});

// DELETE eliminar anuncio
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    await announcement.destroy();
    res.json({ success: true, message: 'Anuncio eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar anuncio' });
  }
});

export default router;
