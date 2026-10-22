import { Request, Response } from 'express';
import Discount from '../../models/Discount';
import { Product } from '../../models/Product';
import { Category } from '../../models/Category';
import { buildPaginationMeta, getSafetyLimit, resolvePagination } from '../../utils/pagination';
import { sendError } from '../../middleware/errorHandler';

const DISCOUNT_EDITABLE_FIELDS = [
    'name',
    'description',
    'discount_type',
    'discount_value',
    'applies_to',
    'category_id',
    'product_id',
    'valid_from',
    'valid_until',
    'is_active'
];

interface DiscountUpdateInput {
    name?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    applies_to?: 'all' | 'category' | 'product';
    category_id?: number;
    product_id?: number;
    valid_from?: Date;
    valid_until?: Date;
    is_active?: boolean;
}

function pickDiscountFields(body: unknown): DiscountUpdateInput {
    const data: Record<string, unknown> = {};

    if (body && typeof body === 'object') {
        const source = body as Record<string, unknown>;
        for (const field of DISCOUNT_EDITABLE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(source, field)) {
                data[field] = source[field];
            }
        }
    }

    return data as DiscountUpdateInput;
}

class DiscountController {
    // --- ADMIN METHODS ---

    /**
     * Get all discounts (Admin)
     */
    async getAllDiscounts(req: Request, res: Response) {
        try {
            const { page, limit, offset, paginated } = resolvePagination(req.query);

            if (paginated) {
                const [{ rows, count }, active] = await Promise.all([
                    Discount.findAndCountAll({
                        order: [['created_at', 'DESC']],
                        limit,
                        offset
                    }),
                    Discount.count({ where: { is_active: true } })
                ]);
                return res.status(200).json({
                    success: true,
                    data: rows,
                    pagination: buildPaginationMeta(page, limit, count),
                    summary: { active, total: count }
                });
            }

            const discounts = await Discount.findAll({
                order: [['created_at', 'DESC']],
                limit: getSafetyLimit(limit)
            });
            return res.status(200).json({ success: true, data: discounts });
        } catch (error) {
            return sendError(res, error, 'Error al obtener descuentos');
        }
    }

    /**
     * Create discount (Admin)
     */
    async createDiscount(req: Request, res: Response) {
        try {
            const {
                name,
                description,
                discount_type,
                discount_value,
                applies_to,
                category_id,
                product_id,
                valid_from,
                valid_until,
                is_active
            } = req.body;

            const discount = await Discount.create({
                name,
                description,
                discount_type,
                discount_value,
                applies_to,
                category_id: category_id || null,
                product_id: product_id || null,
                valid_from,
                valid_until,
                is_active: is_active ?? true
            });

            return res.status(201).json({ success: true, message: 'Descuento creado', data: discount });
        } catch (error) {
            return sendError(res, error, 'Error al crear descuento');
        }
    }

    /**
     * Update discount (Admin)
     */
    async updateDiscount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const discount = await Discount.findByPk(id);

            if (!discount) {
                return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
            }

            await discount.update(pickDiscountFields(req.body));
            return res.status(200).json({ success: true, message: 'Descuento actualizado', data: discount });
        } catch (error) {
            return sendError(res, error, 'Error al actualizar descuento');
        }
    }

    /**
     * Delete discount (Admin)
     */
    async deleteDiscount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const discount = await Discount.findByPk(id);

            if (!discount) {
                return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
            }

            await discount.destroy();
            return res.status(200).json({ success: true, message: 'Descuento eliminado' });
        } catch (error) {
            return sendError(res, error, 'Error al eliminar descuento');
        }
    }
}

export const discountController = new DiscountController();
