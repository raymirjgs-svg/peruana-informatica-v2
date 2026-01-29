import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Op } from 'sequelize';

export class CustomerController {
    /**
     * Get paginated list of customers with filters
     * GET /api/admin/customers?page=1&limit=10&search=&role=&authProvider=&isBlocked=
     */
    static async getCustomers(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string || '';
            const role = req.query.role as string;
            const authProvider = req.query.authProvider as string;
            const isBlocked = req.query.isBlocked as string;

            const offset = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            // Search filter
            if (search) {
                where[Op.or] = [
                    { email: { [Op.like]: `%${search}%` } },
                    { first_name: { [Op.like]: `%${search}%` } },
                    { last_name: { [Op.like]: `%${search}%` } }
                ];
            }

            // Role filter
            if (role) {
                where.role = role;
            }

            // Auth provider filter
            if (authProvider) {
                where.auth_provider = { [Op.like]: `%${authProvider}%` };
            }

            // Blocked status filter
            if (isBlocked !== undefined && isBlocked !== '') {
                where.is_blocked = isBlocked === 'true';
            }

            // Get customers with pagination
            const { count, rows: customers } = await User.findAndCountAll({
                where,
                attributes: {
                    exclude: ['password_hash', 'reset_token', 'reset_token_expiry']
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            res.json({
                customers,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            res.status(500).json({
                message: 'Error fetching customers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get customer by ID with details
     * GET /api/admin/customers/:id
     */
    static async getCustomerById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const customer = await User.findByPk(id, {
                attributes: {
                    exclude: ['password_hash', 'reset_token', 'reset_token_expiry']
                }
            });

            if (!customer) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            res.json({ customer });

        } catch (error) {
            console.error('❌ Error fetching customer:', error);
            res.status(500).json({
                message: 'Error fetching customer',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Toggle block/unblock customer
     * PATCH /api/admin/customers/:id/block
     */
    static async toggleBlockCustomer(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const customer = await User.findByPk(id);

            if (!customer) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            // Prevent blocking admins
            if (customer.role === 'admin') {
                res.status(400).json({ message: 'Cannot block admin users' });
                return;
            }

            // Toggle block status
            customer.is_blocked = !customer.is_blocked;
            await customer.save();

            console.log(`✅ Customer ${customer.email} ${customer.is_blocked ? 'blocked' : 'unblocked'}`);

            res.json({
                message: `Customer ${customer.is_blocked ? 'blocked' : 'unblocked'} successfully`,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    is_blocked: customer.is_blocked
                }
            });

        } catch (error) {
            console.error('❌ Error toggling customer block:', error);
            res.status(500).json({
                message: 'Error updating customer',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get customer statistics
     * GET /api/admin/customers/stats
     */
    static async getCustomerStats(req: Request, res: Response): Promise<void> {
        try {
            // Total customers
            const totalCustomers = await User.count({
                where: { role: 'customer' }
            });

            // Active customers (not blocked)
            const activeCustomers = await User.count({
                where: {
                    role: 'customer',
                    is_blocked: false
                }
            });

            // Blocked customers
            const blockedCustomers = await User.count({
                where: {
                    role: 'customer',
                    is_blocked: true
                }
            });

            // New customers this month
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const newThisMonth = await User.count({
                where: {
                    role: 'customer',
                    createdAt: {
                        [Op.gte]: firstDayOfMonth
                    }
                }
            });

            // Customers by auth provider
            const googleCustomers = await User.count({
                where: {
                    role: 'customer',
                    auth_provider: { [Op.like]: '%google%' }
                }
            });

            const localCustomers = await User.count({
                where: {
                    role: 'customer',
                    auth_provider: 'local'
                }
            });

            res.json({
                total: totalCustomers,
                active: activeCustomers,
                blocked: blockedCustomers,
                newThisMonth,
                byProvider: {
                    google: googleCustomers,
                    local: localCustomers
                }
            });

        } catch (error) {
            console.error('❌ Error fetching customer stats:', error);
            res.status(500).json({
                message: 'Error fetching statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get customer orders (placeholder for future implementation)
     * GET /api/admin/customers/:id/orders
     */
    static async getCustomerOrders(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Check if customer exists
            const customer = await User.findByPk(id);
            if (!customer) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            // TODO: Implement order fetching when Order model is ready
            // For now, return empty array
            res.json({
                orders: [],
                totalOrders: 0,
                totalSpent: 0,
                message: 'Order integration coming soon'
            });

        } catch (error) {
            console.error('❌ Error fetching customer orders:', error);
            res.status(500).json({
                message: 'Error fetching orders',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
