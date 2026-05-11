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

// GET /list — lista imágenes subidas en public/images/products/
router.get('/list', (req: Request, res: Response) => {
    try {
        const uploadDir = path.join(__dirname, '../../../public/images/products');
        if (!fs.existsSync(uploadDir)) {
            return res.json({ images: [] });
        }
        const files = fs.readdirSync(uploadDir)
            .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
            .map(f => {
                const stat = fs.statSync(path.join(uploadDir, f));
                return { filename: f, size: stat.size, created: stat.birthtime };
            })
            .sort((a, b) => b.created.getTime() - a.created.getTime());

        const baseUrl = process.env.FRONTEND_URL || process.env.API_URL || 'http://localhost';
        const images = files.map(f => ({
            filename: f.filename,
            url: `${baseUrl}/images/products/${f.filename}`,
            size: f.size,
            created: f.created,
        }));
        res.json({ images });
    } catch (error: any) {
        console.error('Error listing images:', error);
        res.status(500).json({ error: error.message || 'Error al listar imágenes' });
    }
});

// DELETE /delete/:filename — elimina una imagen subida
router.delete('/delete/:filename', (req: Request, res: Response) => {
    try {
        const rawName = req.params.filename as string;
        const filename = path.basename(rawName); // prevent path traversal
        const filePath = path.join(__dirname, '../../../public/images/products', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar imagen' });
    }
});

// GET /extract-video?url=... — extrae URL de video de una página de producto
router.get('/extract-video', async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).json({ error: 'Parámetro url requerido' });

    let pageUrl: URL;
    try { pageUrl = new URL(rawUrl); } catch { return res.status(400).json({ error: 'URL inválida' }); }

    const fetchRaw = (url: URL, extraHeaders: Record<string, string> = {}): Promise<string> => new Promise((resolve, reject) => {
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache',
                ...extraHeaders,
            },
            timeout: 12000,
        };
        const r2 = lib.get(options, (r) => {
            if (r.statusCode && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                try { resolve(fetchRaw(new URL(r.headers.location, url.origin))); } catch { reject(new Error('Redirect error')); }
                return;
            }
            let data = '';
            r.setEncoding('utf8');
            r.on('data', chunk => { data += chunk; if (data.length > 800000) r.destroy(); });
            r.on('end', () => resolve(data));
            r.on('error', reject);
        });
        r2.on('timeout', () => { r2.destroy(); reject(new Error('Timeout')); });
        r2.on('error', reject);
    });

    const extractVideos = (html: string): string[] => {
        const found = new Set<string>();

        // 1. Decode unicode escapes (\u002F → /)
        const decoded = html.replace(/\\u([\dA-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

        const videoPatterns = [
            // Alibaba Video CDN (main pattern: gv.videocdn.alibaba.com)
            /https?:\/\/(?:gv\.|[a-z0-9-]*)videocdn\.alibaba\.com\/[^\s"'<>\\]+?\.mp4(?:\?[^\s"'<>\\]*)?/gi,
            // Alibaba / AliExpress static CDN
            /https?:\/\/(?:sc\d*|v|video|img)\.alicdn\.com\/[^\s"'<>\\]+?\.mp4(?:[^\s"'<>\\]*)?/gi,
            /https?:\/\/[^\s"'<>\\]+?\.alicdn\.com\/[^\s"'<>\\]+?\.mp4(?:[^\s"'<>\\]*)?/gi,
            // JSON-style video fields (with or without quotes)
            /"(?:videoUrl|video_url|videoSrc|video_src|mediaUrl|media_url|url|src)"\s*:\s*"(https?:\/\/[^"]+?\.mp4[^"]*)"/gi,
            // HTML src attribute with mp4
            /src="(https?:\/\/[^"]+?\.mp4[^"]*)"/gi,
            /src='(https?:\/\/[^']+?\.mp4[^']*)'/gi,
            // Generic quoted mp4 URLs in any source
            /"(https?:\/\/[^"]{10,}\.mp4[^"]*)"/gi,
            /'(https?:\/\/[^']{10,}\.mp4[^']*)'/gi,
            // AliExpress / 1688 / Aliyun OSS
            /https?:\/\/(?:ae\d*|gw)\.alicdn\.com\/[^\s"'<>]+?\.mp4/gi,
            /https?:\/\/(?:[a-z0-9-]+)\.oss-[a-z0-9-]+\.aliyuncs\.com\/[^\s"'<>]+?\.mp4/gi,
        ];

        for (const pattern of videoPatterns) {
            for (const m of decoded.matchAll(pattern)) {
                const url = (m[1] || m[0]).trim().replace(/["\\']+$/g, '');
                if (url.startsWith('http') && url.includes('.mp4')) found.add(url);
            }
        }
        return [...found].slice(0, 8);
    };

    try {
        // Attempt 1: fetch product page directly
        let html = '';
        try { html = await fetchRaw(pageUrl); } catch { /* fall through */ }
        let videos = extractVideos(html);

        // Attempt 2: try Alibaba JSON offering API (product detail JSON endpoint)
        if (videos.length === 0 && pageUrl.hostname.includes('alibaba.com')) {
            const idMatch = pageUrl.pathname.match(/_(\d{10,})\.html/) || pageUrl.search.match(/offerId=(\d+)/);
            const offerId = idMatch?.[1];
            if (offerId) {
                try {
                    const jsonUrl = new URL(`https://www.alibaba.com/offerdetail/${offerId}.json`);
                    const jsonHtml = await fetchRaw(jsonUrl, { 'Accept': 'application/json' });
                    videos = extractVideos(jsonHtml);
                } catch { /* fall through */ }
            }
        }

        // Attempt 3: AliExpress product JSON
        if (videos.length === 0 && pageUrl.hostname.includes('aliexpress.com')) {
            const idMatch = pageUrl.pathname.match(/\/item\/(\d+)/) || pageUrl.search.match(/productId=(\d+)/);
            const productId = idMatch?.[1];
            if (productId) {
                try {
                    const jsonUrl = new URL(`https://www.aliexpress.com/item/${productId}.html`);
                    const ae = await fetchRaw(jsonUrl, { 'Referer': 'https://www.aliexpress.com/' });
                    videos = extractVideos(ae);
                } catch { /* fall through */ }
            }
        }

        if (videos.length === 0) {
            return res.json({
                found: false,
                message: 'No se encontró video automáticamente (Alibaba carga los videos con JavaScript). Instrucciones manuales: abre la página en Chrome → presiona F12 → pestaña "Red/Network" → filtra por "mp4" → recarga la página → copia la URL que aparezca.'
            });
        }

        return res.json({ found: true, videos, recommended: videos[0] });
    } catch (err: any) {
        return res.status(500).json({ error: 'No se pudo acceder a la página: ' + (err.message || 'Error desconocido') });
    }
});

export default router;
