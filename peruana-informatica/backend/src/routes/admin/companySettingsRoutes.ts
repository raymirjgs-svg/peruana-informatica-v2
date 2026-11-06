import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as CompanySettingsController from '../../controllers/admin/CompanySettingsController';

const router = Router();

// Configure storage for Multer
const fs = require('fs');

// Configure storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/settings';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Obtener configuración de empresa (admin)
router.get('/', CompanySettingsController.getCompanySettings);

// Actualizar configuración de empresa (admin)
router.put('/', CompanySettingsController.updateCompanySettings);

// Upload files
router.post('/upload-logo', upload.single('logo'), CompanySettingsController.uploadLogo);
router.post('/upload-favicon', upload.single('favicon'), CompanySettingsController.uploadFavicon);

export default router;
