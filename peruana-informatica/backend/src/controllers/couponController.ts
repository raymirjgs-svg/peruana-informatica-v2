import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';
import { buildPaginationMeta, getSafetyLimit, resolvePagination } from '../utils/pagination';

const COUPON_TYPES = ['percentage', 'fixed'];

const COUPON_EDITABLE_FIELDS = [
    'code',
    'type',
    'value',
    'min_purchase',
    'max_uses',
    'valid_from',
    'valid_until',
    'description',
    'is_active'
];

function pickCouponFields(body: any): Record<string, any> {
    const data: Record<string, any> = {};

    for (const field of COUPON_EDITABLE_FIELDS) {
        if (body && Object.prototype.hasOwnProperty.call(body, field)) {
            data[field] = body[field];
        }
    }

    return data;
}

function validateCouponTypeAndValue(type: any, value: any): string | null {
    if (!COUPON_TYPES.includes(type)) {
        return 'El tipo de cupón debe ser "percentage" o "fixed"';
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 'El valor del cupón debe ser un número';
    }

    if (type === 'percentage' && (numericValue <= 0 || numericValue > 100)) {
        return 'El porcentaje del cupón debe ser mayor a 0 y menor o igual a 100';
    }

    if (type === 'fixed' && numericValue <= 0) {
        return 'El valor del cupón debe ser mayor a 0';
    }

    return null;
}

export class CouponController {
    /**
     * Validate and apply coupon (Public endpoint)
     */
    async validateCoupon(req: Request, res: Response) {
        try {
            const { code, purchase_amount } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Código de cupón requerido'
                });
            }

            const coupon = await Coupon.findOne({
                where: { code: code.toUpperCase() }
            });

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
            }

            const validation = coupon.isValid(purchase_amount || 0);

            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }

            const discountAmount = coupon.calculateDiscount(purchase_amount || 0);

            return res.status(200).json({
                success: true,
                data: {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    discount_amount: discountAmount,
                    description: coupon.description
                }
            });
        } catch (error) {
            console.error('Error validating coupon:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al validar cupón'
            });
        }
    }

    /**
     * Apply coupon (validate only, never mutate usage)
     */
    async applyCoupon(req: Request, res: Response) {
        try {
            const { code, purchase_amount } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Código de cupón requerido'
                });
            }

            const coupon = await Coupon.findOne({
                where: { code: String(code).toUpperCase() }
            });

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
            }

            const validation = coupon.isValid(purchase_amount || 0);

            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }

            const discountAmount = coupon.calculateDiscount(purchase_amount || 0);

            return res.status(200).json({
                success: true,
                message: 'Cupón válido',
                data: {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    discount_amount: discountAmount,
                    description: coupon.description
                }
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al aplicar cupón'
            });
        }
    }

    // =================== ADMIN ENDPOINTS ===================

    /**
     * Get all coupons (Admin)
     */
    async getAllCoupons(req: Request, res: Response) {
        try {
            const { page, limit, offset, paginated } = resolvePagination(req.query);

            if (paginated) {
                const [{ rows, count }, active, totalUses] = await Promise.all([
                    Coupon.findAndCountAll({
                        order: [['created_at', 'DESC']],
                        limit,
                        offset
                    }),
                    Coupon.count({ where: { is_active: true } }),
                    Coupon.sum('current_uses')
                ]);
                return res.status(200).json({
                    success: true,
                    data: rows,
                    pagination: buildPaginationMeta(page, limit, count),
                    summary: { active, totalUses: totalUses || 0, total: count }
                });
            }

            const coupons = await Coupon.findAll({
                order: [['created_at', 'DESC']],
                limit: getSafetyLimit(limit)
            });

            return res.status(200).json({
                success: true,
                data: coupons
            });
        } catch (error) {
            console.error('Error fetching coupons:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener cupones'
            });
        }
    }

    /**
     * Create coupon (Admin)
     */
    async createCoupon(req: Request, res: Response) {
        try {
            const {
                code,
                type,
                value,
                min_purchase,
                max_uses,
                valid_from,
                valid_until,
                description
            } = req.body;

            if (!code || !type || !value) {
                return res.status(400).json({
                    success: false,
                    message: 'code, type y value son requeridos'
                });
            }

            const validationError = validateCouponTypeAndValue(type, value);

            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }

            const coupon = await Coupon.create({
                code: code.toUpperCase(),
                type,
                value,
                min_purchase,
                max_uses,
                valid_from,
                valid_until,
                description,
                is_active: true
            });

            return res.status(201).json({
                success: true,
                message: 'Cupón creado exitosamente',
                data: coupon
            });
        } catch (error: any) {
            console.error('Error creating coupon:', error);

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'El código del cupón ya existe'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al crear cupón'
            });
        }
    }

    /**
     * Update coupon (Admin)
     */
    async updateCoupon(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = pickCouponFields(req.body);

            const coupon = await Coupon.findByPk(id);

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
            }

            const effectiveType = updateData.type !== undefined ? updateData.type : coupon.type;
            const effectiveValue = updateData.value !== undefined ? updateData.value : coupon.value;

            const validationError = validateCouponTypeAndValue(effectiveType, effectiveValue);

            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }

            if (typeof updateData.code === 'string') {
                updateData.code = updateData.code.toUpperCase();
            }

            await coupon.update(updateData);

            return res.status(200).json({
                success: true,
                message: 'Cupón actualizado exitosamente',
                data: coupon
            });
        } catch (error) {
            console.error('Error updating coupon:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar cupón'
            });
        }
    }

    /**
     * Delete coupon (Admin)
     */
    async deleteCoupon(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const coupon = await Coupon.findByPk(id);

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
            }

            await coupon.destroy();

            return res.status(200).json({
                success: true,
                message: 'Cupón eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar cupón'
            });
        }
    }

    /**
     * Toggle coupon active status (Admin)
     */
    async toggleCouponStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const coupon = await Coupon.findByPk(id);

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
            }

            await coupon.update({
                is_active: !coupon.is_active
            });

            return res.status(200).json({
                success: true,
                message: `Cupón ${coupon.is_active ? 'activado' : 'desactivado'}`,
                data: coupon
            });
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del cupón'
            });
        }
    }
}

export const couponController = new CouponController();
