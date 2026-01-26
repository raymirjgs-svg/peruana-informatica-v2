import { sequelize } from '../database/connection';
import { Wishlist } from '../models/Wishlist';

async function createWishlistsTable() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Create the wishlists table
        await Wishlist.sync({ force: false }); // force: false will not drop existing table
        console.log('✅ Wishlists table created/verified successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating wishlists table:', error);
        process.exit(1);
    }
}

createWishlistsTable();
