import express from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { paymentProofUpload } from '../middleware/uploadPaymentProof';

const router = express.Router();

// Create Preference (Protected)
router.post('/create-preference', authenticateToken, paymentController.createPreference);
// Create Preference from Order (exige el codigo de seguimiento del pedido)
router.post('/create-preference-order', paymentController.createPreferenceFromOrder);

// Webhook (Public, MP calls this)
router.post('/webhook', paymentController.receiveWebhook);

// Culqi — cobro directo con token generado por Culqi.js
router.post('/culqi/charge', paymentController.culqiCharge);

// Upload Payment Proof (requiere el codigo de seguimiento del pedido)
// Move dynamic route to the end to avoid conflict with static routes like 'create-preference'
router.post('/:orderId/upload-proof', paymentProofUpload.single('payment_proof'), paymentController.uploadProof);

export default router;
