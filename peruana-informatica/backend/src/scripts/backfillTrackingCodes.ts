import { sequelize } from '../database/connection';
import { Order } from '../models/Order';
import { generateTrackingCode } from '../utils/trackingCode';

const MAX_ATTEMPTS = 8;

async function backfillTrackingCodes(): Promise<void> {
    try {
        await sequelize.authenticate();

        const orders = await Order.findAll({
            attributes: ['id', 'tracking_code'],
            where: { tracking_code: null },
            order: [['id', 'ASC']],
        });

        let updated = 0;
        let skipped = 0;
        let failed = 0;

        for (const order of orders) {
            let assigned = false;
            let wasSkipped = false;

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                try {
                    const [affectedRows] = await Order.update(
                        { tracking_code: generateTrackingCode() },
                        { where: { id: order.id, tracking_code: null } }
                    );

                    if (affectedRows === 1) {
                        assigned = true;
                    } else {
                        wasSkipped = true;
                    }
                    break;
                } catch (error) {
                    const isUniqueConflict =
                        error instanceof Error && error.name === 'SequelizeUniqueConstraintError';
                    if (!isUniqueConflict) throw error;
                }
            }

            if (assigned) {
                updated++;
            } else if (wasSkipped) {
                skipped++;
            } else {
                failed++;
            }
        }

        console.log(
            `Backfill de tracking finalizado: ${updated} actualizados, ${skipped} omitidos, ${failed} fallidos.`
        );

        if (failed > 0) process.exitCode = 1;
    } catch (error) {
        console.error('Error en el backfill de tracking:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

backfillTrackingCodes();
