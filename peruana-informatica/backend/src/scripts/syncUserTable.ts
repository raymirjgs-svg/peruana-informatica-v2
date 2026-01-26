import { User } from '../models/User';
import { Order } from '../models/Order';
import { connectDatabase, sequelize } from '../database/connection';

async function syncUserTable() {
    try {
        await connectDatabase();
        console.log('🔄 Sincronizando tabla users y orders...');
        await User.sync({ alter: true });
        await Order.sync({ alter: true });
        console.log('✅ Tablas sincronizadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error sincronizando tabla:', error);
        process.exit(1);
    }
}

syncUserTable();
