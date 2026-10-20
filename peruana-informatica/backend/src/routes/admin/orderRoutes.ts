import { Router } from 'express';
import { getOrders, updateOrderStatus, getPaymentProof } from '../../controllers/admin/OrderController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', getOrders);
router.get('/:id/payment-proof', getPaymentProof);
router.patch('/:id/status', updateOrderStatus);

export default router;
