import { Request, Response } from 'express';
import { Image } from '../models/Image';
import { Product } from '../models/Product';

// GET all images for a product
export const getImagesByProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId as string);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        error: 'ID de producto inválido',
        code: 'INVALID_PRODUCT_ID'
      });
    }

    // Obtener el producto para obtener su codigo_interno
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Buscar imágenes por codigo_interno
    const images = await Image.findAll({
      where: { codigo_interno: product.codigo_interno },
      attributes: ['cod_galeria', 'codigo_interno', 'imagen']
    });

    res.json(images);
  } catch (error) {
    console.error('Error getting product images:', error);
    res.status(500).json({ 
      error: 'Error al obtener imágenes del producto',
      code: 'IMAGES_FETCH_ERROR'
    });
  }
};

// POST create a new image for a product
export const createImage = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { imagen } = req.body;
    
    const productIdInt = parseInt(productId as string);
    
    if (isNaN(productIdInt)) {
      return res.status(400).json({ 
        error: 'ID de producto inválido',
        code: 'INVALID_PRODUCT_ID'
      });
    }

    // Verify product exists
    const product = await Product.findByPk(productIdInt);
    if (!product) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Crear imagen usando codigo_interno
    const image = await Image.create({
      codigo_interno: product.codigo_interno,
      cod_producto: productIdInt,
      imagen
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error creating image:', error);
    res.status(500).json({ 
      error: 'Error al crear imagen',
      code: 'IMAGE_CREATE_ERROR'
    });
  }
};

// DELETE an image
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const imageId = parseInt(req.params.imageId as string);
    
    if (isNaN(imageId)) {
      return res.status(400).json({ 
        error: 'ID de imagen inválido',
        code: 'INVALID_IMAGE_ID'
      });
    }

    const image = await Image.findByPk(imageId);
    
    if (!image) {
      return res.status(404).json({ 
        error: 'Imagen no encontrada',
        code: 'IMAGE_NOT_FOUND'
      });
    }

    await image.destroy();

    res.json({ 
      message: 'Imagen eliminada correctamente',
      id: imageId
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      error: 'Error al eliminar imagen',
      code: 'IMAGE_DELETE_ERROR'
    });
  }
};