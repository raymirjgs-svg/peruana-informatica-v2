import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Carousel } from '../../models/Carousel';

const router = express.Router();

// Configuración de multer para subir imágenes
const uploadDir = path.join(__dirname, '../../../public/images/carousel');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slide-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middleware de validación
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// GET todos los slides del carrusel
router.get('/', async (req: Request, res: Response) => {
  try {
    const slides = await Carousel.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']]
    });

    res.json(slides);
  } catch (error) {
    console.error('Error getting carousel slides:', error);
    res.status(500).json({ 
      error: 'Error al obtener slides del carrusel',
      code: 'CAROUSEL_FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET slides activos para el frontend
router.get('/active', async (req: Request, res: Response) => {
  try {
    const slides = await Carousel.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'title', 'description', 'buttonText', 'buttonUrl', 'backgroundColor', 'imageUrl', 'showTitle', 'showDescription', 'showButton', 'textPosition', 'titleSize']
    });

    res.json(slides);
  } catch (error) {
    console.error('Error getting active carousel slides:', error);
    res.status(500).json({ 
      error: 'Error al obtener slides activos',
      code: 'CAROUSEL_ACTIVE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET slide por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);

    if (!slide) {
      return res.status(404).json({ 
        error: 'Slide no encontrado',
        code: 'SLIDE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.json(slide);
  } catch (error) {
    console.error('Error getting slide:', error);
    res.status(500).json({ 
      error: 'Error al obtener slide',
      code: 'SLIDE_FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// POST crear slide
router.post('/', [
  body('title').notEmpty().isLength({ min: 1, max: 200 }).withMessage('Título es requerido y debe tener entre 1 y 200 caracteres'),
  body('description').notEmpty().isLength({ min: 1, max: 1000 }).withMessage('Descripción es requerida y debe tener entre 1 y 1000 caracteres'),
  body('buttonText').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Texto del botón es requerido y debe tener entre 1 y 100 caracteres'),
  body('buttonUrl').notEmpty().isString().withMessage('URL del botón es requerida y debe ser una cadena válida'),
  body('backgroundColor').optional().isLength({ max: 100 }).withMessage('Color de fondo no puede exceder 100 caracteres'),
  body('imageUrl').optional().isString().withMessage('URL de imagen debe ser una cadena válida'),
  body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
  body('order').optional().isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { title, description, buttonText, buttonUrl, backgroundColor, imageUrl, isActive = true, order = 0 } = req.body;

    const slide = await Carousel.create({
      title,
      description,
      buttonText,
      buttonUrl,
      backgroundColor: backgroundColor || 'from-blue-500 to-blue-700',
      imageUrl,
      isActive,
      order,
    });

    res.status(201).json(slide);
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({ 
      error: 'Error al crear slide',
      code: 'SLIDE_CREATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT actualizar slide
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
  body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Título debe tener entre 1 y 200 caracteres'),
  body('description').optional().isLength({ min: 1, max: 1000 }).withMessage('Descripción debe tener entre 1 y 1000 caracteres'),
  body('buttonText').optional().isLength({ min: 1, max: 100 }).withMessage('Texto del botón debe tener entre 1 y 100 caracteres'),
  body('buttonUrl').optional().isString().withMessage('URL del botón debe ser una cadena válida'),
  body('backgroundColor').optional().isLength({ max: 100 }).withMessage('Color de fondo no puede exceder 100 caracteres'),
  body('imageUrl').optional().isString().withMessage('URL de imagen debe ser una cadena válida'),
  body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
  body('order').optional().isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({ 
        error: 'Slide no encontrado',
        code: 'SLIDE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    await slide.update(req.body);

    res.json(slide);
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({ 
      error: 'Error al actualizar slide',
      code: 'SLIDE_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE eliminar slide
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({ 
        error: 'Slide no encontrado',
        code: 'SLIDE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    await slide.destroy();

    res.json({ 
      message: 'Slide eliminado correctamente',
      id: slide.id
    });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({ 
      error: 'Error al eliminar slide',
      code: 'SLIDE_DELETE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT actualizar orden de slides
router.put('/reorder', [
  body('slides').isArray().withMessage('slides debe ser un array'),
  body('slides.*.id').isInt({ min: 1 }).withMessage('ID de slide debe ser un número entero mayor a 0'),
  body('slides.*.order').isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { slides } = req.body;

    // Actualizar el orden de cada slide
    for (const slideData of slides) {
      await Carousel.update(
        { order: slideData.order },
        { where: { id: slideData.id } }
      );
    }

    res.json({ 
      message: 'Orden actualizado correctamente',
      updatedSlides: slides.length
    });
  } catch (error) {
    console.error('Error reordering slides:', error);
    res.status(500).json({ 
      error: 'Error al actualizar orden',
      code: 'SLIDE_REORDER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// POST subir imagen de carousel
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se subió ninguna imagen',
        code: 'NO_IMAGE_UPLOADED'
      });
    }

    // Retornar la URL de la imagen
    const imageUrl = `/images/carousel/${req.file.filename}`;
    
    res.json({ 
      imageUrl,
      filename: req.file.filename,
      message: 'Imagen subida correctamente'
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    if (error.message.includes('Solo se permiten imágenes')) {
      return res.status(400).json({ 
        error: error.message,
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    res.status(500).json({ 
      error: 'Error al subir imagen',
      code: 'IMAGE_UPLOAD_ERROR',
      details: error.message
    });
  }
});

export default router;
