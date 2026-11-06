import { Router } from 'express';
import { analyticsController } from '../../controllers/analyticsController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// KPIs and overview
router.get('/kpis', analyticsController.getKPIs.bind(analyticsController));
router.get('/sales-overview', analyticsController.getSalesOverview.bind(analyticsController));

// Product analytics
router.get('/top-products', analyticsController.getTopProducts.bind(analyticsController));

// Sales breakdown
router.get('/payment-methods', analyticsController.getSalesByPaymentMethod.bind(analyticsController));

// Recent activity
router.get('/recent-orders', analyticsController.getRecentOrders.bind(analyticsController));

// Conversion metrics
router.get('/conversion', analyticsController.getConversionMetrics.bind(analyticsController));

export default router;
