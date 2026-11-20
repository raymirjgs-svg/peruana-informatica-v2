import { sequelize } from '../database/connection';
import { down } from '../database/migrations/20261119-add-mercadopago-payment-method';

async function rollback(): Promise<void> {
    try {
        await sequelize.authenticate();
        await down(sequelize.getQueryInterface());
        console.log('Migracion revertida: orders.payment_method vuelve a su ENUM anterior.');
    } catch (error) {
        console.error('Error al revertir la migracion de metodo de pago:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

rollback();
