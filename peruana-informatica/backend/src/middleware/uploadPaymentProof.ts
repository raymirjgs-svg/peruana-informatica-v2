import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Almacenamiento de comprobantes de pago.
 *
 * El directorio `public/payment-proofs` esta montado como volumen Docker
 * (persistente) en produccion, por lo que los comprobantes sobreviven a los
 * redeploys.
 */
const uploadDir = path.join(process.cwd(), 'public', 'payment-proofs');

export const paymentProofUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif|pdf/;
        const mimetype = /image\/(jpeg|jpg|png|webp|gif)|application\/pdf/.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes o PDF'));
    },
});
