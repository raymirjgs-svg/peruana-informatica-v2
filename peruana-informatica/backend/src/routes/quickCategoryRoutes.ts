import { Router } from 'express';
import { QuickCategory } from '../models/QuickCategory';

const router = Router();

// GET accesos rápidos activos (público)
router.get('/', async (req, res) => {
  try {
    const items = await QuickCategory.findAll({
      where: { is_active: true },
      attributes: ['id', 'icon', 'label', 'href', 'order'],
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

export default router;
