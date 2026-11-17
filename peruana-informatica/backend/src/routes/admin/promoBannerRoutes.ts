import { Router } from 'express';
import { promoBannerController } from '../../controllers/promoBannerController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// Protegemos todas las rutas con el token de administrador
router.use(authenticateToken, requireAdmin);

// Admin banner management
router.get('/', promoBannerController.getAllBanners.bind(promoBannerController));
router.post('/', promoBannerController.createBanner.bind(promoBannerController));
router.put('/:id', promoBannerController.updateBanner.bind(promoBannerController));
router.delete('/:id', promoBannerController.deleteBanner.bind(promoBannerController));
router.patch('/:id/toggle', promoBannerController.toggleBannerStatus.bind(promoBannerController));

export default router;
