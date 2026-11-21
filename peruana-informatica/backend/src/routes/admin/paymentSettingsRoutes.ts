import { Router } from 'express';
import { PaymentSettingsController } from '../../controllers/admin/PaymentSettingsController';

const router = Router();

router.get('/', PaymentSettingsController.getSettings);
router.put('/', PaymentSettingsController.saveSettings);
router.post('/test-mercadopago', PaymentSettingsController.testMercadoPago);

export default router;
