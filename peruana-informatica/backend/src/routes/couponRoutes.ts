import { Router } from 'express';
import { couponController } from '../controllers/couponController';

const router = Router();

// Public endpoints
router.post('/validate', couponController.validateCoupon.bind(couponController));
router.post('/apply', couponController.applyCoupon.bind(couponController));

export default router;
