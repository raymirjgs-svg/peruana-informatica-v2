import { sequelize } from '../database/connection';
import { up } from '../database/migrations/20261117-add-order-coupon-discount';

async function migrate(): Promise<void> {
    try {
        await sequelize.authenticate();
        await up(sequelize.getQueryInterface());
        console.log('Migracion aplicada: orders.coupon_code y orders.discount_amount estan disponibles.');
    } catch (error) {
        console.error('Error en la migracion de cupon/descuento:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

migrate();
