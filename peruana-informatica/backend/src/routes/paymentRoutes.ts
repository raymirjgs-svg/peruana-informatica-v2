import express from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use process.cwd() to target 'backend/public/uploads' reliably
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp, gif)'));
    }
});

// Create Preference (Protected)
router.post('/create-preference', authenticateToken, paymentController.createPreference);
// Create Preference from Order
router.post('/create-preference-order', paymentController.createPreferenceFromOrder);

// Webhook (Public, MP calls this)
router.post('/webhook', paymentController.receiveWebhook);

// Culqi — cobro directo con token generado por Culqi.js
router.post('/culqi/charge', paymentController.culqiCharge);

// Upload Payment Proof (Public/Generic)
// Move dynamic route to the end to avoid conflict with static routes like 'create-preference'
router.post('/:orderId/upload-proof', upload.single('payment_proof'), paymentController.uploadProof);

export default router;
