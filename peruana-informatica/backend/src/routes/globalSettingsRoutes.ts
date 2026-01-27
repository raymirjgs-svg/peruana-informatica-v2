import { Router } from 'express';
import { getCheckoutMode } from '../controllers/admin/SettingController';

const router = Router();

router.get('/checkout-mode', getCheckoutMode);

export default router;
