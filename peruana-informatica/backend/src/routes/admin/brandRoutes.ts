import express, { Request, Response } from 'express';
import { Brand } from '../../models/Brand';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { buildPaginationMeta, getSafetyLimit, resolvePagination } from '../../utils/pagination';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// GET todas las marcas
router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, limit, offset, paginated } = resolvePagination(req.query);

        if (paginated) {
            const { rows, count } = await Brand.findAndCountAll({
                order: [['name', 'ASC']],
                limit,
                offset
            });
            return res.json({
                success: true,
                data: rows,
                pagination: buildPaginationMeta(page, limit, count)
            });
        }

        const brands = await Brand.findAll({
            order: [['name', 'ASC']],
            limit: getSafetyLimit(limit)
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
