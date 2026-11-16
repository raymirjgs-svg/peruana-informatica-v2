import { sequelize } from '../database/connection';
import { up } from '../database/migrations/20261116-add-order-tracking-code';

async function migrate(): Promise<void> {
    try {
        await sequelize.authenticate();
        await up(sequelize.getQueryInterface());
        console.log('Migración de tracking aplicada: orders.tracking_code está disponible.');
    } catch (error) {
        console.error('Error en la migración de tracking:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

migrate();
