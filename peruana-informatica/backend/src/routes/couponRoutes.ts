import { couponLimiter } from '../middleware/rateLimiter';
import { Router } from 'express';
import { couponController } from '../controllers/couponController';

const router = Router();

// Public endpoints
router.post('/validate', couponLimiter, couponController.validateCoupon.bind(couponController));
router.post('/apply', couponLimiter, couponController.applyCoupon.bind(couponController));

export default router;
