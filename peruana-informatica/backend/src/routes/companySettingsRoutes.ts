import { Router } from 'express';
import { getPublicCompanySettings } from '../controllers/admin/CompanySettingsController';

const router = Router();

// Ruta pública para obtener configuración de empresa
router.get('/', getPublicCompanySettings);

export default router;
