import { sequelize } from '../database/connection';
import { up } from '../database/migrations/20261119-add-mercadopago-payment-method';

async function migrate(): Promise<void> {
    try {
        await sequelize.authenticate();
        await up(sequelize.getQueryInterface());
        console.log('Migracion aplicada: orders.payment_method acepta "mercadopago".');
    } catch (error) {
        console.error('Error en la migracion de metodo de pago:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

migrate();
