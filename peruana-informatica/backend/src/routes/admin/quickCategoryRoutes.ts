import { Router } from 'express';
import { QuickCategory } from '../../models/QuickCategory';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// GET todos
router.get('/', async (req, res) => {
  try {
    const items = await QuickCategory.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error GET quick-categories:', error);
    res.status(500).json({ success: false, data: [], error: 'Error al obtener accesos rápidos' });
  }
});

// POST crear
router.post('/', async (req, res) => {
  try {
    const { icon, label, href, order, is_active } = req.body;
    if (!label?.trim()) return res.status(400).json({ success: false, error: 'La etiqueta es requerida' });
    if (!href?.trim()) return res.status(400).json({ success: false, error: 'El enlace es requerido' });
    const item = await QuickCategory.create({ icon: icon || '📦', label, href, order: order ?? 0, is_active: is_active ?? true });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error POST quick-categories:', error);
    res.status(500).json({ success: false, error: 'Error al crear acceso rápido' });
  }
});

// PUT actualizar
router.put('/:id', async (req, res) => {
  try {
    const item = await QuickCategory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'No encontrado' });
    const { icon, label, href, order, is_active } = req.body;
    if (label !== undefined && !label.trim()) return res.status(400).json({ success: false, error: 'La etiqueta no puede estar vacía' });
    if (href !== undefined && !href.trim()) return res.status(400).json({ success: false, error: 'El enlace no puede estar vacío' });
    await item.update({ icon, label, href, order, is_active });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error PUT quick-categories:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar' });
  }
});

// PATCH toggle activo
router.patch('/:id/toggle', async (req, res) => {
  try {
    const item = await QuickCategory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'No encontrado' });
    await item.update({ is_active: !item.is_active });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error PATCH quick-categories toggle:', error);
    res.status(500).json({ success: false, error: 'Error al cambiar estado' });
  }
});

// DELETE eliminar
router.delete('/:id', async (req, res) => {
  try {
    const item = await QuickCategory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'No encontrado' });
    await item.destroy();
    res.json({ success: true, message: 'Eliminado' });
  } catch (error) {
    console.error('Error DELETE quick-categories:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar' });
  }
});

export default router;
