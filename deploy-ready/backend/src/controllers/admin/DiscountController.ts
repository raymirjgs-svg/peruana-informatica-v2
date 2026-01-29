import { Request, Response } from 'express';
import Discount from '../../models/Discount';
import { Product } from '../../models/Product';
import { Category } from '../../models/Category';

class DiscountController {
    // --- ADMIN METHODS ---

    /**
     * Get all discounts (Admin)
     */
    async getAllDiscounts(req: Request, res: Response) {
        try {
            const discounts = await Discount.findAll({
                order: [['created_at', 'DESC']]
            });
            return res.status(200).json({ success: true, data: discounts });
        } catch (error) {
            console.error('Error fetching discounts:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener descuentos' });
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
            console.error('Error creating discount:', error);
            return res.status(500).json({ success: false, message: 'Error al crear descuento' });
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

            await discount.update(req.body);
            return res.status(200).json({ success: true, message: 'Descuento actualizado', data: discount });
        } catch (error) {
            console.error('Error updating discount:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar descuento' });
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
            console.error('Error deleting discount:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar descuento' });
        }
    }
}

export const discountController = new DiscountController();
