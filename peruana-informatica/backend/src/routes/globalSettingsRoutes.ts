import { Router } from 'express';
import { getCheckoutMode } from '../controllers/admin/SettingController';
import { settingsController } from '../controllers/SettingsController';

const router = Router();

router.get('/', settingsController.getAllSettings);
router.get('/checkout-mode', getCheckoutMode);
router.get('/payment-methods', settingsController.getPaymentMethods);

export default router;
