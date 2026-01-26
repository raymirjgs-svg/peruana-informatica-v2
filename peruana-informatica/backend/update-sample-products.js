const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function updateSampleProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'prueba'
  });

  try {
    console.log('Updating sample products with realistic stock and prices...');
    
    // Update a few sample products with real data
    const updates = [
      {
        id: 1191,
        codigo_interno: '20230',
        stock: 9,
        price: 2389.00,
        price_web: 2250.00
      },
      {
        id: 1190,
        codigo_interno: '20229',
        stock: 15,
        price: 3199.00,
        price_web: 2999.00
      },
      {
        id: 1189,
        codigo_interno: '20228',
        stock: 7,
        price: 2899.00,
        price_web: 2699.00
      },
      {
        id: 1188,
        codigo_interno: '20227',
        stock: 12,
        price: 3499.00,
        price_web: 3299.00
      },
      {
        id: 1187,
        codigo_interno: '20226',
        stock: 5,
        price: 2999.00,
        price_web: 2799.00
      }
    ];

    for (const product of updates) {
      const [result] = await connection.execute(
        'UPDATE products SET stock = ?, price = ?, price_web = ? WHERE cod_producto = ?',
        [product.stock, product.price, product.price_web, product.id]
      );
      
      console.log(`Updated product ${product.codigo_interno}: Stock=${product.stock}, Price=S/.${product.price}, Web=S/.${product.price_web}`);
    }

    console.log('\n✓ Sample products updated successfully!');
    console.log('These products will now show real stock and pricing information.');
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const [rows] = await connection.execute(
      'SELECT cod_producto, codigo_interno, name, stock, price, price_web FROM products WHERE cod_producto IN (1191, 1190, 1189, 1188, 1187) ORDER BY cod_producto DESC'
    );
    
    console.log('\nUpdated products:');
    rows.forEach(row => {
      console.log(`${row.codigo_interno}: ${row.name.substring(0, 50)}...`);
      console.log(`  Stock: ${row.stock}`);
      console.log(`  Price: S/.${row.price}`);
      console.log(`  Web Price: S/.${row.price_web}\n`);
    });

  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await connection.end();
  }
}

updateSampleProducts();