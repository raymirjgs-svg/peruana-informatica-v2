import express from 'express';
import { cartController } from '../controllers/cartController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', cartController.getCart);
router.post('/sync', cartController.syncCart);
router.post('/item', cartController.updateItem);
router.delete('/item/:productId', cartController.removeItem);

export default router;
