import { Router } from 'express';
import * as CompanySettingsController from '../controllers/admin/CompanySettingsController';

const router = Router();

// Obtener configuración pública
router.get('/', CompanySettingsController.getPublicCompanySettings);

export default router;
