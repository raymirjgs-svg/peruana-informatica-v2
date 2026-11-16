import { Op } from 'sequelize';
import { sequelize } from '../database/connection';
import { Order } from '../models/Order';
import { EmailService } from '../services/EmailService';

function readLimit(): number {
    const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='));
    if (!limitArgument) return 25;

    const parsed = Number.parseInt(limitArgument.split('=')[1] ?? '25', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 25;
    return Math.min(parsed, 100);
}

async function sendTrackingCodes(): Promise<void> {
    const shouldSend = process.argv.includes('--send');
    const limit = readLimit();

    try {
        await sequelize.authenticate();

        const orders = await Order.findAll({
            attributes: ['id', 'customer_name', 'customer_email', 'tracking_code', 'tracking_code_sent_at'],
            where: {
                tracking_code: { [Op.not]: null },
                tracking_code_sent_at: null,
            },
            order: [['id', 'ASC']],
            limit,
        });

        if (!shouldSend) {
            console.log(
                `Simulación de distribución: ${orders.length} códigos pendientes. Usa --send para enviar este lote.`
            );
            return;
        }

        const emailService = new EmailService();
        let sent = 0;
        let failed = 0;

        for (const order of orders) {
            try {
                await emailService.sendTrackingCodeToClient(order);
                await Order.update(
                    { tracking_code_sent_at: new Date() },
                    { where: { id: order.id, tracking_code_sent_at: null } }
                );
                sent++;
            } catch {
                failed++;
                console.error('No se pudo enviar un código de seguimiento. Se omissionará en el próximo lote.');
            }

            await new Promise((resolve) => setTimeout(resolve, 750));
        }

        console.log(`Distribución de códigos finalizada: ${sent} enviados, ${failed} fallidos.`);
        if (failed > 0) process.exitCode = 1;
    } catch (error) {
        console.error('Error en la distribución de códigos:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

sendTrackingCodes();
