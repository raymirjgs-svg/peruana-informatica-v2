import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public read (needed for checkout page)
router.get('/checkout-mode', settingsController.getCheckoutMode);

// Admin update
router.put('/checkout-mode', authenticateToken, requireAdmin, settingsController.updateCheckoutMode);

export default router;
