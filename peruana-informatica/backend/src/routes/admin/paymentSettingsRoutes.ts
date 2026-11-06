import { Router } from 'express';
import { PaymentSettingsController } from '../../controllers/admin/PaymentSettingsController';
import { authenticateAdmin } from '../../middleware/auth';

const router = Router();

router.use(authenticateAdmin);

router.get('/', PaymentSettingsController.getSettings);
router.put('/', PaymentSettingsController.saveSettings);
router.post('/test-culqi', PaymentSettingsController.testCulqi);

export default router;
