import { Router } from 'express';
import { promoBannerController } from '../../controllers/promoBannerController';

const router = Router();

// Admin banner management
router.get('/', promoBannerController.getAllBanners.bind(promoBannerController));
router.post('/', promoBannerController.createBanner.bind(promoBannerController));
router.put('/:id', promoBannerController.updateBanner.bind(promoBannerController));
router.delete('/:id', promoBannerController.deleteBanner.bind(promoBannerController));
router.patch('/:id/toggle', promoBannerController.toggleBannerStatus.bind(promoBannerController));

export default router;
