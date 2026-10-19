import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../public/uploads');
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

const hasValidImageSignature = (filePath: string): boolean => {
    let fd: number | undefined;
    try {
        fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(12);
        const bytesRead = fs.readSync(fd, header, 0, 12, 0);

        if (bytesRead >= 3 && header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            return true;
        }

        if (bytesRead >= 8 &&
            header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47 &&
            header[4] === 0x0D && header[5] === 0x0A && header[6] === 0x1A && header[7] === 0x0A) {
            return true;
        }

        if (bytesRead >= 4 &&
            header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
            return true;
        }

        if (bytesRead >= 12 &&
            header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
            header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
            return true;
        }

        return false;
    } catch (error) {
        return false;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        }
    }
};

// POST /upload - Subir un archivo
router.post('/', upload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        if (!hasValidImageSignature(req.file.path)) {
            fs.unlink(req.file.path, () => undefined);
            return res.status(400).json({ error: 'Archivo no es una imagen válida' });
        }

        // Construir URL pública
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message || 'Error al subir archivo' });
    }
});

export default router;
