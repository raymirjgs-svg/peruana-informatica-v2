import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Product } from '../models/Product';
import { Op } from 'sequelize';
import { emailService } from './EmailService';
import { logger } from '../config/logger';

export class AbandonedCartService {
    /**
     * Find abandoned carts (>1 hour inactive, not converted)
     */
    async findAbandonedCarts() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            const abandonedCarts = await Cart.findAll({
                where: {
                    updated_at: {
                        [Op.lt]: oneHourAgo
                    },
                    // Assume cart is abandoned if not converted to order
                    // You can add a 'status' field or check against orders table
                },
                include: [{
                    model: CartItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product',
                        attributes: ['name', 'price', 'image']
                    }]
                }]
            });

            return (abandonedCarts as any[]).filter(cart =>
                cart.items && cart.items.length > 0
            );
        } catch (error) {
            logger.error('Error finding abandoned carts:', error);
            return [];
        }
    }

    /**
     * Send abandoned cart recovery emails
     */
    async sendRecoveryEmails() {
        try {
            const carts = await this.findAbandonedCarts();
            let sentCount = 0;

            for (const cart of (carts as any[])) {
                // Only send if we have customer email (from user or session)
                const customerEmail = cart.user_id ?
                    (await cart.getUser?.())?.email :
                    cart.session_email; // You may need to add this field

                if (customerEmail) {
                    await this.sendAbandonedCartEmail(customerEmail, cart);
                    sentCount++;
                }
            }

            logger.info(`Sent ${sentCount} abandoned cart recovery emails`);
            return sentCount;
        } catch (error) {
            logger.error('Error sending recovery emails:', error);
            return 0;
        }
    }

    /**
     * Send abandoned cart email to specific customer
     */
    private async sendAbandonedCartEmail(email: string, cart: any) {
        try {
            const items = cart.items.map((item: any) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                image: item.product.image
            }));

            const total = items.reduce((sum: number, item: any) =>
                sum + (item.price * item.quantity), 0
            );

            const template = this.generateAbandonedCartTemplate(items, total);

            await emailService.sendEmail({
                to: email,
                subject: '¡No te olvides de tu carrito! 🛒',
                html: template
            });

            logger.info(`Abandoned cart email sent to ${email}`);
        } catch (error) {
            logger.error(`Error sending abandoned cart email to ${email}:`, error);
        }
    }

    /**
     * Generate HTML template for abandoned cart email
     */
    private generateAbandonedCartTemplate(items: any[], total: number): string {
        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                </td>
                <td style="padding: 10px;">
                    <p style="margin: 0; font-weight: bold;">${item.name}</p>
                    <p style="margin: 5px 0 0 0; color: #666;">Cantidad: ${item.quantity}</p>
                </td>
                <td style="padding: 10px; text-align: right;">
                    <p style="margin: 0; font-weight: bold;">S/ ${(item.price * item.quantity).toFixed(2)}</p>
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table cellpadding="0" cellspacing="0" width="600" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                                        <h1 style="color: white; margin: 0; font-size: 28px;">¡No te olvides! 🛒</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Dejaste productos en tu carrito</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                                            Hola,<br><br>
                                            Notamos que dejaste algunos productos en tu carrito. ¡No los pierdas!
                                        </p>
                                        
                                        <!-- Products -->
                                        <table cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 8px;">
                                            ${itemsHtml}
                                        </table>
                                        
                                        <!-- Total -->
                                        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                                            <tr>
                                                <td style="text-align: right; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                                                    <p style="margin: 0; font-size: 18px;"><strong>Total: S/ ${total.toFixed(2)}</strong></p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- CTA Button -->
                                        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${process.env.FRONTEND_URL}/cart" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                                        Completar mi compra →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                                            ¿Tienes preguntas? <a href="${process.env.FRONTEND_URL}/contacto" style="color: #667eea;">Contáctanos</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                                        <p style="margin: 0; font-size: 12px; color: #999;">
                                            © ${new Date().getFullYear()} Peruana de Informática. Todos los derechos reservados.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
    }
}

export const abandonedCartService = new AbandonedCartService();
