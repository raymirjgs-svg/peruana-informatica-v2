import { Router } from 'express';
import { getOrders, updateOrderStatus } from '../../controllers/admin/OrderController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);

export default router;
