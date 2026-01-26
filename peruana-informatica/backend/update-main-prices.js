const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function updateMainPrices() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'prueba'
  });

  try {
    console.log('Updating main prices (pre_cli) for sample products...');
    
    // Update pre_cli (main customer price) to match the price field
    const updates = [
      { id: 1191, codigo_interno: '20230', pre_cli: 2389.00 },
      { id: 1190, codigo_interno: '20229', pre_cli: 3199.00 },
      { id: 1189, codigo_interno: '20228', pre_cli: 2899.00 },
      { id: 1188, codigo_interno: '20227', pre_cli: 3499.00 },
      { id: 1187, codigo_interno: '20226', pre_cli: 2999.00 }
    ];

    for (const product of updates) {
      const [result] = await connection.execute(
        'UPDATE products SET pre_cli = ? WHERE id = ?',
        [product.pre_cli, product.id]
      );
      
      console.log(`Updated product ${product.codigo_interno} pre_cli: S/.${product.pre_cli}`);
    }

    console.log('\n✓ Main prices updated successfully!');
    
    // Verify the updates
    console.log('\nVerifying price updates...');
    const [rows] = await connection.execute(
      'SELECT id, codigo_interno, name, price, pre_cli, pre_web, stock FROM products WHERE id IN (1191, 1190, 1189, 1188, 1187) ORDER BY id DESC'
    );
    
    console.log('\nFinal product data:');
    rows.forEach(row => {
      console.log(`${row.codigo_interno}: ${row.name.substring(0, 50)}...`);
      console.log(`  Stock: ${row.stock}`);
      console.log(`  Price: S/.${row.price} (price field)`);
      console.log(`  Main Price: S/.${row.pre_cli} (pre_cli)`);
      console.log(`  Web Price: S/.${row.pre_web}\n`);
    });

  } catch (error) {
    console.error('Error updating prices:', error);
  } finally {
    await connection.end();
  }
}

updateMainPrices();