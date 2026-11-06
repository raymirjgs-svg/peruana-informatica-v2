import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Brand } from '../../models/Brand';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// ── Multer para logos de marca (SVG + imágenes) ────────────────────────────
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../public/images/brands');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const unique = `${Date.now()}-${safe}`;
    cb(null, unique);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /svg|jpeg|jpg|png|webp/;
    const mime = file.mimetype === 'image/svg+xml' || allowed.test(file.mimetype);
    const ext = allowed.test(path.extname(file.originalname).toLowerCase().replace('.', ''));
    if (mime && ext) return cb(null, true);
    cb(new Error('Solo se permiten imágenes SVG, PNG, JPG o WebP'));
  },
});

// ── GET todas las marcas ───────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const brands = await Brand.findAll({
      attributes: ['id', 'name', 'slug', 'logo', 'show_in_carousel', 'created_at'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, error: 'Error al obtener marcas' });
  }
});

// ── PATCH /:id/toggle-carousel ─────────────────────────────────────────────
router.patch('/:id/toggle-carousel', async (req: Request, res: Response) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, error: 'Marca no encontrada' });
    await brand.update({ show_in_carousel: !brand.show_in_carousel });
    res.json({ success: true, data: brand });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar marca' });
  }
});

// ── POST /:id/logo — subir logo ────────────────────────────────────────────
router.post('/:id/logo', logoUpload.single('logo'), async (req: Request, res: Response) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, error: 'Marca no encontrada' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });

    // Eliminar logo anterior si era del backend
    if (brand.logo && brand.logo.includes('/images/brands/') && !brand.logo.startsWith('/images/brands/')) {
      const old = path.join(__dirname, '../../../public', brand.logo.replace(/^https?:\/\/[^/]+/, ''));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    const backendOrigin = `http://localhost:${process.env.PORT || 3001}`;
    const logoPath = `${backendOrigin}/images/brands/${req.file.filename}`;
    await brand.update({ logo: logoPath, show_in_carousel: true });
    res.json({ success: true, data: brand, logoPath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al subir logo' });
  }
});

// ── DELETE /:id/logo — quitar logo ─────────────────────────────────────────
router.delete('/:id/logo', async (req: Request, res: Response) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, error: 'Marca no encontrada' });
    await brand.update({ logo: null, show_in_carousel: false });
    res.json({ success: true, message: 'Logo eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar logo' });
  }
});

export default router;
