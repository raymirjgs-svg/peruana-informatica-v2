import { Request, Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Image } from '../models/Image';
import { Op } from 'sequelize';

export class WishlistController {
    /**
     * Get user's wishlist
     */
    async getUserWishlist(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id; // Assumes auth middleware sets req.user

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const wishlistItems = await Wishlist.findAll({
                where: { user_id: userId },
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['cod_producto', 'codigo_interno', 'name', 'slug', 'price', 'stock'],
                        include: [
                            {
                                model: Brand,
                                as: 'productBrand',
                                attributes: ['name', 'slug'],
                            },
                            {
                                model: Category,
                                as: 'productCategory',
                                attributes: ['name', 'slug'],
                            },
                            {
                                model: Image,
                                as: 'images',
                                attributes: ['imagen'],
                                limit: 1,
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({
                success: true,
                data: wishlistItems
            });
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener la lista de deseos'
            });
        }
    }

    /**
     * Add product to wishlist
     */
    async addToWishlist(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { product_id } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            if (!product_id) {
                return res.status(400).json({
                    success: false,
                    message: 'product_id es requerido'
                });
            }

            // Check if product exists
            const product = await Product.findByPk(product_id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // Add to wishlist (will ignore if already exists due to unique constraint)
            const [wishlistItem, created] = await Wishlist.findOrCreate({
                where: {
                    user_id: userId,
                    product_id
                },
                defaults: {
                    user_id: userId,
                    product_id
                }
            });

            return res.status(created ? 201 : 200).json({
                success: true,
                message: created ? 'Producto agregado a favoritos' : 'Producto ya estaba en favoritos',
                data: wishlistItem
            });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al agregar a favoritos'
            });
        }
    }

    /**
     * Remove product from wishlist
     */
    async removeFromWishlist(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { productId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const deleted = await Wishlist.destroy({
                where: {
                    user_id: userId,
                    product_id: productId
                }
            });

            if (deleted === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado en favoritos'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Producto eliminado de favoritos'
            });
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar de favoritos'
            });
        }
    }

    /**
     * Clear wishlist
     */
    async clearWishlist(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            await Wishlist.destroy({
                where: { user_id: userId }
            });

            return res.status(200).json({
                success: true,
                message: 'Lista de deseos limpiada'
            });
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al limpiar la lista de deseos'
            });
        }
    }

    /**
     * Check if product is in wishlist
     */
    async checkWishlist(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { productId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const exists = await Wishlist.findOne({
                where: {
                    user_id: userId,
                    product_id: productId
                }
            });

            return res.status(200).json({
                success: true,
                inWishlist: !!exists
            });
        } catch (error) {
            console.error('Error checking wishlist:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar favoritos'
            });
        }
    }

    // ============================================
    // ADMIN METHODS
    // ============================================

    /**
     * Get wishlist analytics (Admin)
     */
    async getWishlistAnalytics(req: Request, res: Response) {
        try {
            // 1. Top wishlisted products (Aggregation only)
            const topProductsAgg = await Wishlist.findAll({
                attributes: [
                    'product_id',
                    [Wishlist.sequelize!.fn('COUNT', Wishlist.sequelize!.col('product_id')), 'wishlist_count']
                ],
                group: ['product_id'],
                order: [[Wishlist.sequelize!.fn('COUNT', Wishlist.sequelize!.col('product_id')), 'DESC']],
                limit: 10
            });

            // 2. Fetch product details
            const productIds = topProductsAgg.map(item => item.product_id);
            const products = await Product.findAll({
                where: {
                    cod_producto: { [Op.in]: productIds }
                },
                attributes: ['cod_producto', 'codigo_interno', 'name', 'slug', 'price', 'stock'],
                include: [{
                    model: Image,
                    as: 'images',
                    attributes: ['imagen'],
                    limit: 1
                }]
            });

            // 3. Merge details back to aggregation
            const topProducts = topProductsAgg.map(item => {
                const product = products.find(p => p.cod_producto === item.product_id);
                const itemData = item.get({ plain: true });
                return {
                    ...itemData,
                    product: product ? {
                        ...product.get({ plain: true }),
                        image: product.images?.[0]?.imagen || null
                    } : null
                };
            });

            // Total stats
            const totalWishlists = await Wishlist.count();
            const uniqueProducts = await Wishlist.count({ distinct: true, col: 'product_id' });

            // Recent additions (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentAdditions = await Wishlist.count({
                where: {
                    created_at: {
                        [Op.gte]: sevenDaysAgo
                    }
                }
            });

            return res.json({
                success: true,
                data: {
                    topProducts,
                    stats: {
                        totalWishlists,
                        uniqueProducts,
                        recentAdditions
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching wishlist analytics:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener análisis de favoritos'
            });
        }
    }

    /**
     * Get all wishlists (Admin) - paginated
     */
    async getAllWishlists(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await Wishlist.findAndCountAll({
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['cod_producto', 'codigo_interno', 'name', 'slug', 'price'],
                    include: [{
                        model: Image,
                        as: 'images',
                        attributes: ['imagen'],
                        limit: 1
                    }]
                }, {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email']
                }],
                limit,
                offset,
                order: [['created_at', 'DESC']]
            });

            return res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching all wishlists:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener listas de deseos'
            });
        }
    }

    /**
     * Get wishlists by product ID (Admin)
     */
    async getWishlistsByProduct(req: Request, res: Response) {
        try {
            const { productId } = req.params;

            const wishlists = await Wishlist.findAll({
                where: { product_id: productId },
                order: [['created_at', 'DESC']]
            });

            const count = wishlists.length;

            return res.json({
                success: true,
                data: {
                    count,
                    wishlists
                }
            });
        } catch (error) {
            console.error('Error fetching product wishlists:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos del producto'
            });
        }
    }
}

export const wishlistController = new WishlistController();
