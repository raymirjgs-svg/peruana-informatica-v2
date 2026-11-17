import { sequelize } from '../database/connection';
import { down } from '../database/migrations/20261117-add-order-coupon-discount';

async function rollback(): Promise<void> {
    try {
        await sequelize.authenticate();
        await down(sequelize.getQueryInterface());
        console.log('Rollback aplicado: orders.coupon_code y orders.discount_amount fueron eliminados.');
    } catch (error) {
        console.error('Error en el rollback de cupon/descuento:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

rollback();
