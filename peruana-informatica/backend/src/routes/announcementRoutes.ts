import { Router } from 'express';
import { Announcement } from '../models/Announcement';

const router = Router();

// GET anuncios activos (público, para la barra del frontend)
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { is_active: true },
      attributes: ['id', 'icon', 'text', 'order'],
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, data: [] });
  }
});

export default router;
