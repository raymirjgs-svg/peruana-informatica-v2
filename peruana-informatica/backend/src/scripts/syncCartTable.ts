import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { connectDatabase } from '../database/connection';

async function syncCartTables() {
    try {
        await connectDatabase();
        console.log('🔄 Sincronizando tablas de carrito...');
        await Cart.sync({ alter: true });
        await CartItem.sync({ alter: true });
        console.log('✅ Tablas Cart y CartItem sincronizadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error sincronizando tablas:', error);
        process.exit(1);
    }
}

syncCartTables();
