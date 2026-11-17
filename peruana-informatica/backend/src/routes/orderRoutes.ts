import { Router } from 'express';
import { createOrder } from '../controllers/OrderController';
import {
    createPaymentPreferenceByTrackingCode,
    downloadInvoiceByTrackingCode,
    getOrderByTrackingCode,
    syncPaymentStatusByTrackingCode,
    uploadPaymentProofByTrackingCode,
} from '../controllers/OrderTrackingController';
import { trackingLimiter } from '../middleware/rateLimiter';
import { validationRules, handleValidationErrors } from '../middleware/validation';
import { paymentProofUpload } from '../middleware/uploadPaymentProof';

const router = Router();

// ── Seguimiento seguro por codigo ──────────────────────────────────
// El codigo es la credencial del cliente: nunca se expone el id numerico.
router.get('/track/:code', trackingLimiter, getOrderByTrackingCode);
router.get('/track/:code/invoice', trackingLimiter, downloadInvoiceByTrackingCode);
router.post('/track/:code/payment-preference', trackingLimiter, createPaymentPreferenceByTrackingCode);
router.post('/track/:code/payment-status', trackingLimiter, syncPaymentStatusByTrackingCode);
router.post(
    '/track/:code/payment-proof',
    trackingLimiter,
    paymentProofUpload.single('payment_proof'),
    uploadPaymentProofByTrackingCode
);

router.post('/', validationRules.createOrder, handleValidationErrors, createOrder);

export default router;
