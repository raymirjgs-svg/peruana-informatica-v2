import { Router } from 'express';
import { MarketingController } from '../../controllers/admin/MarketingController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/customer-count', MarketingController.getCustomerCount);
router.post('/send-bulk-email', MarketingController.sendBulkEmail);

export default router;
