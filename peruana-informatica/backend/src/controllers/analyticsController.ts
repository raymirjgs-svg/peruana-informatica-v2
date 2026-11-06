import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';
import { Image } from '../models/Image';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Op } from 'sequelize';

export class AnalyticsController {

    /**
     * Get sales overview - revenue over time
     */
    async getSalesOverview(req: Request, res: Response) {
        try {
            const { period = '30d' } = req.query;

            // Calculate date range
            const now = new Date();
            let startDate = new Date();

            switch (period) {
                case '7d':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(now.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(now.getDate() - 30);
            }

            // Get daily sales
            const dailySales = await Order.findAll({
                attributes: [
                    [Order.sequelize!.fn('DATE', Order.sequelize!.col('createdAt')), 'date'],
                    [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'orders'],
                    [Order.sequelize!.fn('SUM', Order.sequelize!.col('total_amount')), 'revenue']
                ],
                where: {
                    createdAt: {
                        [Op.gte]: startDate
                    },
                    payment_status: 'verified'
                },
                group: [Order.sequelize!.fn('DATE', Order.sequelize!.col('createdAt'))],
                order: [[Order.sequelize!.fn('DATE', Order.sequelize!.col('createdAt')), 'ASC']],
                raw: true
            });

            return res.json({
                success: true,
                data: dailySales
            });
        } catch (error) {
            console.error('Error fetching sales overview:', error);
            return res.status(500).json({ error: 'Error al obtener resumen de ventas' });
        }
    }

    /**
     * Get key performance indicators (KPIs)
     */
    async getKPIs(req: Request, res: Response) {
        try {
            // Total revenue (all time)
            const totalRevenue = await Order.sum('total_amount', {
                where: { payment_status: 'verified' }
            }) || 0;

            // Total orders
            const totalOrders = await Order.count({
                where: { payment_status: 'verified' }
            });

            // Average order value
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Revenue this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthRevenue = await Order.sum('total_amount', {
                where: {
                    payment_status: 'verified',
                    createdAt: {
                        [Op.gte]: startOfMonth
                    }
                }
            }) || 0;

            // Orders this month
            const monthOrders = await Order.count({
                where: {
                    payment_status: 'verified',
                    createdAt: {
                        [Op.gte]: startOfMonth
                    }
                }
            });

            // Pending orders (require attention)
            const pendingOrders = await Order.count({
                where: { payment_status: 'pending' }
            });

            // Total customers (unique users)
            const totalCustomers = await Order.count({
                distinct: true,
                col: 'customer_email',
                where: { payment_status: 'verified' }
            });

            // New customers this month
            const newCustomersMonth = await Order.count({
                distinct: true,
                col: 'customer_email',
                where: {
                    payment_status: 'verified',
                    createdAt: {
                        [Op.gte]: startOfMonth
                    }
                }
            });

            return res.json({
                success: true,
                data: {
                    totalRevenue: Number(totalRevenue).toFixed(2),
                    totalOrders,
                    avgOrderValue: Number(avgOrderValue).toFixed(2),
                    monthRevenue: Number(monthRevenue).toFixed(2),
                    monthOrders,
                    pendingOrders,
                    totalCustomers,
                    newCustomersMonth
                }
            });
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            return res.status(500).json({ error: 'Error al obtener KPIs' });
        }
    }

    /**
     * Get top selling products
     */
    async getTopProducts(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;

            // 1. Get aggregated stats from OrderItems
            const topSellingItems = await OrderItem.findAll({
                attributes: [
                    'product_id',
                    [OrderItem.sequelize!.fn('SUM', OrderItem.sequelize!.col('quantity')), 'total_sold'],
                    [OrderItem.sequelize!.fn('SUM', OrderItem.sequelize!.literal('quantity * price')), 'total_revenue']
                ],
                group: ['product_id'],
                order: [[OrderItem.sequelize!.fn('SUM', OrderItem.sequelize!.col('quantity')), 'DESC']],
                limit: Number(limit)
            });

            // 2. Get product details for these items
            const productIds = topSellingItems.map(item => item.product_id);

            const products = await Product.findAll({
                where: {
                    cod_producto: {
                        [Op.in]: productIds
                    }
                },
                attributes: ['cod_producto', 'codigo_interno', 'name', 'slug', 'price', 'stock'],
                include: [{
                    model: Image,
                    as: 'images',
                    attributes: ['imagen'],
                    limit: 1
                }]
            });

            // 3. Merge data
            const results = topSellingItems.map(item => {
                const product = products.find(p => p.cod_producto === item.product_id);
                const itemData = item.get({ plain: true });
                return {
                    ...itemData,
                    product: product ? {
                        ...product.get({ plain: true }),
                        image: product.images?.[0]?.imagen || null // Simplify image access for frontend
                    } : null
                };
            });

            return res.json({
                success: true,
                data: results
            });
        } catch (error) {
            console.error('Error fetching top products:', error);
            return res.status(500).json({ error: 'Error al obtener productos más vendidos' });
        }
    }

    /**
     * Get sales by payment method
     */
    async getSalesByPaymentMethod(req: Request, res: Response) {
        try {
            const salesByMethod = await Order.findAll({
                attributes: [
                    'payment_method',
                    [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'count'],
                    [Order.sequelize!.fn('SUM', Order.sequelize!.col('total_amount')), 'revenue']
                ],
                where: {
                    payment_status: 'verified',
                    payment_method: { [Op.not]: null }
                },
                group: ['payment_method'],
                raw: true
            });

            return res.json({
                success: true,
                data: salesByMethod
            });
        } catch (error) {
            console.error('Error fetching sales by payment method:', error);
            return res.status(500).json({ error: 'Error al obtener ventas por método de pago' });
        }
    }

    /**
     * Get recent orders
     */
    async getRecentOrders(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;

            const recentOrders = await Order.findAll({
                attributes: ['id', 'customer_name', 'customer_email', 'total_amount', 'payment_status', 'status', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: Number(limit)
            });

            return res.json({
                success: true,
                data: recentOrders
            });
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            return res.status(500).json({ error: 'Error al obtener pedidos recientes' });
        }
    }

    /**
     * Get conversion metrics
     */
    async getConversionMetrics(req: Request, res: Response) {
        try {
            // Total products viewed (approximate using reviews as proxy)
            const totalReviews = await Review.count();

            // Total orders
            const totalOrders = await Order.count();

            // Verified orders
            const verifiedOrders = await Order.count({
                where: { payment_status: 'verified' }
            });

            // Conversion rate (orders / product views) - simplified
            const conversionRate = totalReviews > 0 ? (verifiedOrders / totalReviews) * 100 : 0;

            // Payment verification rate
            const verificationRate = totalOrders > 0 ? (verifiedOrders / totalOrders) * 100 : 0;

            return res.json({
                success: true,
                data: {
                    totalOrders,
                    verifiedOrders,
                    conversionRate: conversionRate.toFixed(2),
                    verificationRate: verificationRate.toFixed(2)
                }
            });
        } catch (error) {
            console.error('Error fetchingconversion metrics:', error);
            return res.status(500).json({ error: 'Error al obtener métricas de conversión' });
        }
    }
}

export const analyticsController = new AnalyticsController();
