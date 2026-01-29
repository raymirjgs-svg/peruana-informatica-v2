import { Router } from 'express';
import { getSystemHealth } from '../../controllers/admin/SystemController';
import { authenticateAdmin } from '../../middleware/auth';

const router = Router();

router.get('/health-check', authenticateAdmin, getSystemHealth);

export default router;
