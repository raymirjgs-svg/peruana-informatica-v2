import express from 'express';
import { paymentController } from '../controllers/PaymentController';

const router = express.Router();

// Webhook (Public, MP calls this)
router.post('/webhook', paymentController.receiveWebhook);

export default router;
