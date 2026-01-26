import express, { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Op } from 'sequelize';

const router = express.Router();

// Dashboard principal
router.get('/', async (req: Request, res: Response) => {
  try {
    // Obtener estadísticas
    const totalProducts = await Product.count();
    const totalCategories = await Category.count();
    const totalBrands = await Brand.count();
    
    // Productos recientes
    const recentProducts = await Product.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Brand,
          as: 'productBrand',
          attributes: ['name'],
        },
        {
          model: Category,
          as: 'productCategory',
          attributes: ['name'],
        }
      ]
    });

    // Productos con stock bajo
    const lowStockProducts = await Product.findAll({
      where: {
        stock: {
          [Op.lte]: 10
        }
      },
      limit: 5,
      include: [
        {
          model: Brand,
          as: 'productBrand',
          attributes: ['name'],
        }
      ]
    });

    res.json({
      stats: {
        totalProducts,
        totalCategories,
        totalBrands,
        lowStockCount: lowStockProducts.length
      },
      recentProducts,
      lowStockProducts
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ 
      error: 'Error al obtener datos del dashboard',
      code: 'DASHBOARD_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
