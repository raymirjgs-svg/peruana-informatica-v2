import { sequelize } from '../database/connection';
import { up } from '../database/migrations/20261120-add-order-idempotency-key';

async function migrate(): Promise<void> {
    try {
        await sequelize.authenticate();
        await up(sequelize.getQueryInterface());
        console.log('Migracion aplicada: orders.idempotency_key con indice unico.');
    } catch (error) {
        console.error('Error en la migracion de idempotencia:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

migrate();
