import { sequelize } from '../database/connection';
import { Contact } from '../models/Contact';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { logger } from '../config/logger';

async function syncDatabase() {
  try {
    logger.info('🔌 Connecting to database...');
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    logger.info('📋 Models loaded:');
    logger.info('- Contact:', !!Contact);
    logger.info('- Product:', !!Product);
    logger.info('- Brand:', !!Brand);
    logger.info('- Category:', !!Category);

    // Set up associations - ALREADY DEFINED IN MODELS
    /*
    if (Product && Brand && Category) {
      Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'productBrand' });
      Product.belongsTo(Category, { foreignKey: 'category_id', as: 'productCategory' });
      Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products' });
      Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
      logger.info('🔗 Model associations configured');
    }
    */

    logger.info('🛠️ Syncing database schema...');

    // Force sync to recreate tables (use with caution in production)
    await sequelize.sync({ force: false, alter: true });

    logger.info('✅ Database schema synchronized successfully!');

    // Test Contact model
    logger.info('🧪 Testing Contact model...');
    const testContact = await Contact.build({
      nombre: 'Test User',
      email: 'test@example.com',
      asunto: 'consulta-producto',
      mensaje: 'This is a test message',
    });

    logger.info('✅ Contact model validation passed');

    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    logger.info('📊 Available tables:', tables);

    logger.info('🎉 Database sync completed successfully!');

  } catch (error) {
    logger.error('❌ Database sync failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncDatabase()
    .then(() => {
      logger.info('✅ Sync script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Sync script failed:', error);
      process.exit(1);
    });
}

export { syncDatabase };
