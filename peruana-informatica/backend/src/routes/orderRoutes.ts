import { Router } from 'express';
import { createOrder } from '../controllers/OrderController';
import { getOrderByTrackingCode } from '../controllers/OrderTrackingController';
import { trackingLimiter } from '../middleware/rateLimiter';
import { validationRules, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.get('/track/:code', trackingLimiter, getOrderByTrackingCode);
router.post('/', validationRules.createOrder, handleValidationErrors, createOrder);

export default router;
