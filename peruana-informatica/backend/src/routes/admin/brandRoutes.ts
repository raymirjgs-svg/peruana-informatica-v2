import express, { Request, Response } from 'express';
import { Brand } from '../../models/Brand';

const router = express.Router();

// GET todas las marcas
router.get('/', async (req: Request, res: Response) => {
    try {
        const brands = await Brand.findAll({
            order: [['name', 'ASC']]
        });
        res.json(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({
            error: 'Error al obtener marcas',
            code: 'BRANDS_FETCH_ERROR'
        });
    }
});

export default router;
