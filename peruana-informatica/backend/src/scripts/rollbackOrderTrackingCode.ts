import { sequelize } from '../database/connection';
import { down } from '../database/migrations/20261116-add-order-tracking-code';

async function rollback(): Promise<void> {
    try {
        await sequelize.authenticate();
        await down(sequelize.getQueryInterface());
        console.log('Migración de tracking revertida.');
    } catch (error) {
        console.error('Error al revertir la migración de tracking:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

rollback();
