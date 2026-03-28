import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

const router = express.Router();

// Guardar en public/images/products/ para que nginx lo sirva via /images/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../public/images/products');
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

// POST /upload - Subir un archivo
router.post('/', upload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        // URL pública accesible via nginx /images/ → backend /images/products/
        const baseUrl = process.env.FRONTEND_URL || process.env.API_URL || 'http://localhost';
        const imageUrl = `${baseUrl}/images/products/${req.file.filename}`;

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

// GET /extract-video?url=... — extrae URL de video de una página de producto
router.get('/extract-video', async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).json({ error: 'Parámetro url requerido' });

    let pageUrl: URL;
    try { pageUrl = new URL(rawUrl); } catch { return res.status(400).json({ error: 'URL inválida' }); }

    const fetchPage = (url: URL): Promise<string> => new Promise((resolve, reject) => {
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 10000,
        };
        const req2 = lib.get(options, (r) => {
            if (r.statusCode && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                try {
                    const redir = new URL(r.headers.location, url.origin);
                    resolve(fetchPage(redir));
                } catch { reject(new Error('Redirect error')); }
                return;
            }
            let data = '';
            r.setEncoding('utf8');
            r.on('data', chunk => { data += chunk; if (data.length > 500000) r.destroy(); });
            r.on('end', () => resolve(data));
            r.on('error', reject);
        });
        req2.on('timeout', () => { req2.destroy(); reject(new Error('Timeout')); });
        req2.on('error', reject);
    });

    try {
        const html = await fetchPage(pageUrl);

        // Patterns to find video URLs in page source
        const videoPatterns = [
            // Direct CDN mp4 URLs (Alibaba / AliExpress CDN)
            /https?:\/\/(?:sc\d*|video|v)\.alicdn\.com\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi,
            /https?:\/\/[^\s"'<>]*\.alicdn\.com\/[^\s"'<>]*\.mp4[^\s"'<>]*/gi,
            // Generic mp4 in quoted strings
            /"(https?:\/\/[^\s"]+\.mp4[^"]*)"/gi,
            /'(https?:\/\/[^\s']+\.mp4[^']*)'/gi,
            // videoUrl patterns in JSON
            /["'](?:videoUrl|video_url|src|url)["']\s*:\s*["'](https?:\/\/[^\s"']+\.mp4[^"']*)/gi,
        ];

        const found = new Set<string>();
        for (const pattern of videoPatterns) {
            const matches = html.matchAll(pattern);
            for (const m of matches) {
                const url = (m[1] || m[0]).replace(/\\u002F/g, '/').replace(/\\/g, '');
                if (url.startsWith('http')) found.add(url);
            }
        }

        const videos = [...found].slice(0, 5);
        if (videos.length === 0) {
            return res.json({ found: false, message: 'No se encontró ningún video en esa página. Intenta obtener el enlace directo del .mp4 desde el navegador.' });
        }

        return res.json({ found: true, videos, recommended: videos[0] });
    } catch (err: any) {
        return res.status(500).json({ error: 'No se pudo acceder a la página: ' + (err.message || 'Error desconocido') });
    }
});

export default router;
