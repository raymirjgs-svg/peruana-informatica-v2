import { sequelize } from '../database/connection';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';

const syncOrders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        await Order.sync({ alter: true });
        console.log('✅ Order table synced');

        await OrderItem.sync({ alter: true });
        console.log('✅ OrderItem table synced');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing tables:', error);
        process.exit(1);
    }
};

syncOrders();
