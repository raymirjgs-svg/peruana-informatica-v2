import { Router } from 'express';
import * as CompanySettingsController from '../../controllers/admin/CompanySettingsController';

const router = Router();

// Obtener configuración de empresa (admin)
router.get('/', CompanySettingsController.getCompanySettings);

// Actualizar configuración de empresa (admin)
router.put('/', CompanySettingsController.updateCompanySettings);

export default router;
