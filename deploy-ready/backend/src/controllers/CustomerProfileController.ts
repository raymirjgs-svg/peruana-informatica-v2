import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export class CustomerProfileController {
    /**
     * Get current user's profile
     * GET /api/customers/profile
     */
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const user = await User.findByPk(userId, {
                attributes: {
                    exclude: ['password_hash', 'reset_token', 'reset_token_expiry']
                }
            });

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({ user });

        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            res.status(500).json({
                message: 'Error fetching profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Update current user's profile
     * PATCH /api/customers/profile
     */
    static async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { first_name, last_name, phone } = req.body;

            const user = await User.findByPk(userId);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // Update allowed fields
            if (first_name !== undefined) user.first_name = first_name;
            if (last_name !== undefined) user.last_name = last_name;
            if (phone !== undefined) user.phone = phone;

            await user.save();

            console.log(`✅ Profile updated for user: ${user.email}`);

            // Return user without sensitive data
            const userResponse = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
                auth_provider: user.auth_provider,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            res.json({
                message: 'Profile updated successfully',
                user: userResponse
            });

        } catch (error) {
            console.error('❌ Error updating profile:', error);
            res.status(500).json({
                message: 'Error updating profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Change password (only for local auth users)
     * PATCH /api/customers/password
     */
    static async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({ message: 'Current password and new password are required' });
                return;
            }

            if (newPassword.length < 6) {
                res.status(400).json({ message: 'New password must be at least 6 characters long' });
                return;
            }

            const user = await User.findByPk(userId);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // Check if user is using local authentication
            if (user.auth_provider !== 'local' && user.auth_provider !== 'local_and_google') {
                res.status(400).json({
                    message: 'Cannot change password for social login accounts',
                    authProvider: user.auth_provider
                });
                return;
            }

            // Verify current password
            const isPasswordValid = await user.validatePassword(currentPassword);
            if (!isPasswordValid) {
                res.status(401).json({ message: 'Current password is incorrect' });
                return;
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password_hash = hashedPassword;
            await user.save();

            console.log(`✅ Password changed for user: ${user.email}`);

            res.json({ message: 'Password changed successfully' });

        } catch (error) {
            console.error('❌ Error changing password:', error);
            res.status(500).json({
                message: 'Error changing password',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get current user's orders (placeholder)
     * GET /api/customers/orders
     */
    static async getMyOrders(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // TODO: Implement order fetching when Order model is ready
            // For now, return empty array
            res.json({
                orders: [],
                message: 'Order integration coming soon'
            });

        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            res.status(500).json({
                message: 'Error fetching orders',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
