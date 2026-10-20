import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { DashboardController } from '../controllers/admin/DashboardController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Dashboard principal
router.get('/', DashboardController.getDashboard);

export default router;