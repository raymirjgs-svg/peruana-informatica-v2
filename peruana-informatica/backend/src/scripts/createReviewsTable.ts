import { sequelize } from '../database/connection';
import { Review } from '../models/Review';

async function createReviewsTable() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Create the reviews table
        await Review.sync({ force: false }); // force: false will not drop existing table
        console.log('✅ Reviews table created/verified successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating reviews table:', error);
        process.exit(1);
    }
}

createReviewsTable();
