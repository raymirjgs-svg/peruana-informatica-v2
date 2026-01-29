import { sequelize } from '../database/connection';
import { Contact } from '../models/Contact';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';

async function syncDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('📋 Models loaded:');
    console.log('- Contact:', !!Contact);
    console.log('- Product:', !!Product);
    console.log('- Brand:', !!Brand);
    console.log('- Category:', !!Category);

    // Set up associations - ALREADY DEFINED IN MODELS
    /*
    if (Product && Brand && Category) {
      Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'productBrand' });
      Product.belongsTo(Category, { foreignKey: 'category_id', as: 'productCategory' });
      Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products' });
      Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
      console.log('🔗 Model associations configured');
    }
    */

    console.log('🛠️ Syncing database schema...');

    // Force sync to recreate tables (use with caution in production)
    await sequelize.sync({ force: false, alter: true });

    console.log('✅ Database schema synchronized successfully!');

    // Test Contact model
    console.log('🧪 Testing Contact model...');
    const testContact = await Contact.build({
      nombre: 'Test User',
      email: 'test@example.com',
      asunto: 'consulta-producto',
      mensaje: 'This is a test message',
    });

    console.log('✅ Contact model validation passed');

    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📊 Available tables:', tables);

    console.log('🎉 Database sync completed successfully!');

  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncDatabase()
    .then(() => {
      console.log('✅ Sync script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync script failed:', error);
      process.exit(1);
    });
}

export { syncDatabase };
