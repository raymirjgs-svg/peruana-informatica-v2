import express, { Request, Response, NextFunction } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { hasValidImageSignature } from '../utils/imageSignature';
import { paymentLimiter, createLimiter } from '../middleware/rateLimiter';

const router = express.Router();

const optionalAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
        return authenticateToken(req, res, next);
    }
    next();
};

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase());
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

const validateImageSignature = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next();
    }

    if (!hasValidImageSignature(req.file.path)) {
        fs.unlink(req.file.path, () => undefined);
        return res.status(400).json({ error: 'El archivo no es una imagen válida' });
    }

    next();
};

// Create Preference (Protected)
router.post('/create-preference', paymentLimiter, authenticateToken, paymentController.createPreference);
// Create Preference from Order
router.post('/create-preference-order', paymentLimiter, paymentController.createPreferenceFromOrder);

// Webhook (Public, MP calls this)
router.post('/webhook', paymentController.receiveWebhook);

// Upload Payment Proof (Public/Generic)
// Move dynamic route to the end to avoid conflict with static routes like 'create-preference'
router.post('/:orderId/upload-proof', optionalAuthenticateToken, createLimiter, upload.single('payment_proof'), validateImageSignature, paymentController.uploadProof);

export default router;
