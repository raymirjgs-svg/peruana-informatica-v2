import { sequelize } from '../database/connection';
import { down } from '../database/migrations/20261120-add-order-idempotency-key';

async function rollback(): Promise<void> {
    try {
        await sequelize.authenticate();
        await down(sequelize.getQueryInterface());
        console.log('Migracion revertida: orders.idempotency_key eliminado.');
    } catch (error) {
        console.error('Error al revertir la migracion de idempotencia:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

rollback();
