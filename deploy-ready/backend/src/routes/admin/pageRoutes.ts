import { Router } from 'express';
import { pageController } from '../../controllers/pageController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// List pages
router.get('/', pageController.getAllPages.bind(pageController));

// Get single page
router.get('/:id', pageController.getPageById.bind(pageController));

// Create page
router.post('/', pageController.createPage.bind(pageController));

// Update page
router.put('/:id', pageController.updatePage.bind(pageController));

// Delete page
router.delete('/:id', pageController.deletePage.bind(pageController));

export default router;
