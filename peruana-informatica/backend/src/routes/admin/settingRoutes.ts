import { Router } from 'express';
import { getSettings, updateSetting } from '../../controllers/admin/SettingController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/', getSettings);
router.put('/:key', updateSetting);

export default router;
