import { Router } from 'express';
import { couponController } from '../../controllers/couponController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

// Admin coupon management
router.get('/', couponController.getAllCoupons.bind(couponController));
router.post('/', couponController.createCoupon.bind(couponController));
router.put('/:id', couponController.updateCoupon.bind(couponController));
router.delete('/:id', couponController.deleteCoupon.bind(couponController));
router.patch('/:id/toggle', couponController.toggleCouponStatus.bind(couponController));

export default router;
