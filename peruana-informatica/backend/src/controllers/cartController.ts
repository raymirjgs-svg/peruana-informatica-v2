import { Request, Response } from 'express';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Product } from '../models/Product';
import { sequelize } from '../database/connection';

export const cartController = {
    // Get Cart (Create if not exists)
    async getCart(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const [cart] = await Cart.findOrCreate({
                where: { user_id: userId, status: 'active' },
                defaults: { user_id: userId, status: 'active' }
            });

            const items = await CartItem.findAll({
                where: { cart_id: cart.id },
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['cod_producto', 'name', 'slug', 'price', 'price_web', 'stock', 'image', 'codigo_interno']
                }]
            });

            res.json({ cart, items });
        } catch (error) {
            console.error('Get cart error:', error);
            res.status(500).json({ error: 'Error getting cart' });
        }
    },

    // Sync Cart (Merge Local with Server)
    async syncCart(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const localItems = req.body.items || []; // Expected: [{ productId, quantity }]

            const [cart] = await Cart.findOrCreate({
                where: { user_id: userId, status: 'active' },
                defaults: { user_id: userId, status: 'active' },
                transaction: t
            });

            // Current server items
            const serverItems = await CartItem.findAll({ where: { cart_id: cart.id }, transaction: t });

            // Merge Strategy: 
            // 1. If product exists in both, use MAX(quantity) or Local (last wins) - Let's use local quantity as it's the latest user intent
            // 2. If product only in local, add to server.
            // 3. If product only in server, KEEP it (persistence).

            for (const localItem of localItems) {
                const existing = serverItems.find(i => i.product_id === localItem.id); // frontend sends 'id' as product id

                if (existing) {
                    // Update quantity if different
                    if (existing.quantity !== localItem.quantity) {
                        await existing.update({ quantity: localItem.quantity }, { transaction: t });
                    }
                } else {
                    // Create new
                    await CartItem.create({
                        cart_id: cart.id,
                        product_id: localItem.id,
                        quantity: localItem.quantity
                    }, { transaction: t });
                }
            }

            await t.commit();

            // Return updated full cart
            const updatedItems = await CartItem.findAll({
                where: { cart_id: cart.id },
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['cod_producto', 'name', 'slug', 'price', 'price_web', 'stock', 'image', 'codigo_interno']
                }]
            });

            res.json({ cart, items: updatedItems });

        } catch (error) {
            await t.rollback();
            console.error('Sync cart error:', error);
            res.status(500).json({ error: 'Error syncing cart' });
        }
    },

    // Update Item (Add/Modify)
    async updateItem(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const { productId, quantity } = req.body;

            const [cart] = await Cart.findOrCreate({
                where: { user_id: userId, status: 'active' },
                defaults: { user_id: userId, status: 'active' }
            });

            const [item, created] = await CartItem.findOrCreate({
                where: { cart_id: cart.id, product_id: productId },
                defaults: { cart_id: cart.id, product_id: productId, quantity }
            });

            if (!created) {
                if (quantity > 0) {
                    await item.update({ quantity });
                } else {
                    await item.destroy();
                }
            }

            res.json({ success: true, item });
        } catch (error) {
            console.error('Update item error:', error);
            res.status(500).json({ error: 'Error updating item' });
        }
    },

    // Remove Item
    async removeItem(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const { productId } = req.params;

            const cart = await Cart.findOne({ where: { user_id: userId, status: 'active' } });
            if (cart) {
                await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Remove item error:', error);
            res.status(500).json({ error: 'Error removing item' });
        }
    }
};
