import { Router } from 'express';
import { getSystemHealth } from '../../controllers/admin/SystemController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

router.get('/health-check', authenticateToken, requireAdmin, getSystemHealth);

export default router;
