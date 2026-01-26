import { Router } from 'express';
import { pageController } from '../controllers/pageController';

const router = Router();

// Get page by slug
router.get('/:slug', pageController.getPageBySlug.bind(pageController));

export default router;
