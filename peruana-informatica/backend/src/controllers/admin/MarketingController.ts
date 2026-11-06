import { Request, Response } from 'express';
import { User } from '../../models/User';
import { emailService } from '../../services/EmailService';

export class MarketingController {
    static async getCustomerCount(req: Request, res: Response) {
        try {
            const count = await User.count({
                where: { role: 'customer', is_blocked: false }
            });
            return res.json({ success: true, data: { count } });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Error al obtener conteo de clientes' });
        }
    }

    static async sendBulkEmail(req: Request, res: Response) {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'El asunto y el mensaje son obligatorios'
            });
        }

        try {
            const customers = await User.findAll({
                where: { role: 'customer', is_blocked: false },
                attributes: ['email', 'first_name', 'last_name']
            });

            if (customers.length === 0) {
                return res.json({
                    success: true,
                    data: { total: 0, sent: 0, failed: 0 },
                    message: 'No hay clientes registrados para enviar'
                });
            }

            let sent = 0;
            let failed = 0;
            const batchSize = 10;

            for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize);
                const results = await Promise.allSettled(
                    batch.map(customer => {
                        const firstName = (customer as any).first_name || 'Cliente';
                        const html = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #1a1a1a;">Hola ${firstName},</h2>
                                <div style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333;">
                                    ${message.replace(/\n/g, '<br/>')}
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
                                <p style="color: #888; font-size: 12px; margin: 0;">
                                    Peruana Informática &mdash; Tu tienda de tecnología de confianza<br/>
                                    Si no deseas recibir más correos, puedes ignorar este mensaje.
                                </p>
                            </div>
                        `;
                        return emailService.sendEmail({
                            to: (customer as any).email,
                            subject,
                            html
                        });
                    })
                );

                results.forEach(result => {
                    if (result.status === 'fulfilled') sent++;
                    else failed++;
                });
            }

            return res.json({
                success: true,
                data: { total: customers.length, sent, failed },
                message: `Correos enviados: ${sent} exitosos, ${failed} fallidos`
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Error al enviar correos masivos'
            });
        }
    }
}
