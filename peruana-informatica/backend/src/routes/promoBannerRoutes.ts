import { Router } from 'express';
import { promoBannerController } from '../controllers/promoBannerController';

const router = Router();

// Public endpoint
router.get('/active', promoBannerController.getActiveBanners.bind(promoBannerController));

export default router;
