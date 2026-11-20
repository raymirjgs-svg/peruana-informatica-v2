import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Product } from '../models/Product';
import { sequelize } from '../database/connection';
import { sendError } from '../middleware/errorHandler';

const PRODUCT_ATTRIBUTES = ['cod_producto', 'name', 'slug', 'price', 'price_web', 'stock', 'image', 'codigo_interno'];

/**
 * Total del carrito calculado por el servidor con los precios de la base de
 * datos. El cliente nunca decide cuanto se cobra.
 */
const cartTotal = (items: any[]): number =>
    Math.round(
        items.reduce((sum, item: any) => {
            const price = Number(item.product?.price || 0);
            return sum + price * Number(item.quantity || 0);
        }, 0) * 100
    ) / 100;

/**
 * Valida las cantidades contra el stock real. Si algo no cabe, se devuelve
 * 400 con el detalle: el carrito del cliente no puede pedir mas de lo que hay.
 */
const validateStock = async (items: Array<{ id: number; quantity: number }>) => {
    const ids = items.map((item) => Number(item.id)).filter((id) => Number.isInteger(id) && id > 0);
    if (ids.length === 0) return [];

    const products = await Product.findAll({
        where: { cod_producto: { [Op.in]: ids } },
        attributes: ['cod_producto', 'name', 'stock'],
    });
    const byId = new Map(products.map((p) => [p.cod_producto, p]));

    const problems: Array<{ id: number; name: string; requested: number; available: number }> = [];
    for (const item of items) {
        const product = byId.get(Number(item.id));
        if (!product) {
            problems.push({ id: Number(item.id), name: `Producto ${item.id}`, requested: Number(item.quantity), available: 0 });
            continue;
        }
        const stock = Number(product.stock || 0);
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
            problems.push({ id: Number(item.id), name: product.name, requested: quantity, available: stock });
        }
    }
    return problems;
};

export const cartController = {
    // Get Cart (Create if not exists)
    async getCart(req: Request, res: Response) {
        try {
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
                    attributes: PRODUCT_ATTRIBUTES
                }]
            });

            res.json({ cart, items, total: cartTotal(items) });
        } catch (error) {
            return sendError(res, error, 'Error getting cart');
        }
    },

    // Sync Cart (Merge Local with Server)
    async syncCart(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            const userId = req.user?.id;
            const localItems = req.body.items || []; // Expected: [{ productId, quantity }]

            // El stock se comprueba antes de tocar nada: si no cabe, no se
            // guarda un carrito que despues no se puede comprar.
            const problems = await validateStock(
                localItems.map((item: any) => ({ id: Number(item.id ?? item.product_id), quantity: Number(item.quantity) }))
            );
            if (problems.length > 0) {
                await t.rollback();
                return res.status(400).json({
                    error: 'No hay stock suficiente para uno de los productos del carrito.',
                    code: 'INSUFFICIENT_STOCK',
                    products: problems,
                });
            }

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
                    attributes: PRODUCT_ATTRIBUTES
                }]
            });

            res.json({ cart, items: updatedItems, total: cartTotal(updatedItems) });

        } catch (error) {
            await t.rollback();
            return sendError(res, error, 'Error syncing cart');
        }
    },

    // Update Item (Add/Modify)
    async updateItem(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { productId, quantity } = req.body;
            const qty = Number(quantity);

            if (!Number.isInteger(qty) || qty < 0) {
                return res.status(400).json({
                    error: 'Cantidad inválida.',
                    code: 'INVALID_QUANTITY',
                });
            }

            if (qty > 0) {
                const problems = await validateStock([{ id: Number(productId), quantity: qty }]);
                const first = problems[0];
                if (first) {
                    return res.status(400).json({
                        error: `No hay stock suficiente de "${first.name}" (disponible: ${first.available}).`,
                        code: 'INSUFFICIENT_STOCK',
                        products: problems,
                    });
                }
            }

            const [cart] = await Cart.findOrCreate({
                where: { user_id: userId, status: 'active' },
                defaults: { user_id: userId, status: 'active' }
            });

            const [item, created] = await CartItem.findOrCreate({
                where: { cart_id: cart.id, product_id: productId },
                defaults: { cart_id: cart.id, product_id: productId, quantity: qty }
            });

            if (!created) {
                if (qty > 0) {
                    await item.update({ quantity: qty });
                } else {
                    await item.destroy();
                }
            }

            const items = await CartItem.findAll({
                where: { cart_id: cart.id },
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: PRODUCT_ATTRIBUTES
                }]
            });

            res.json({ success: true, item, items, total: cartTotal(items) });
        } catch (error) {
            return sendError(res, error, 'Error updating item');
        }
    },

    // Remove Item
    async removeItem(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { productId } = req.params;

            const cart = await Cart.findOne({ where: { user_id: userId, status: 'active' } });
            if (cart) {
                await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });
            }

            res.json({ success: true });
        } catch (error) {
            return sendError(res, error, 'Error removing item');
        }
    }
};
