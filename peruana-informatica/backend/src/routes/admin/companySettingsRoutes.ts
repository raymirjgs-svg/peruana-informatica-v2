import { Router } from 'express';
import * as CompanySettingsController from '../../controllers/admin/CompanySettingsController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Obtener configuración de empresa (admin)
router.get('/', CompanySettingsController.getCompanySettings);

// Actualizar configuración de empresa (admin)
router.put('/', CompanySettingsController.updateCompanySettings);

export default router;
