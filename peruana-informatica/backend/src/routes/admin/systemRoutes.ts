import { Router } from 'express';
import { getSystemHealth } from '../../controllers/admin/SystemController';

const router = Router();

// Route already protected by global JWT middleware in server.ts
router.get('/health-check', getSystemHealth);

export default router;
