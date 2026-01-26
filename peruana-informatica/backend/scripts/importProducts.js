import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURACIÓN - COMPLETA ESTOS DATOS
// ============================================

// Tu base de datos ACTUAL (de donde sacaremos los productos)
const SOURCE_DB = {
  host: process.env.SOURCE_DB_HOST || 'localhost',
  user: process.env.SOURCE_DB_USER || 'root',
  password: process.env.SOURCE_DB_PASSWORD || '',
  database: process.env.SOURCE_DB_NAME || 'peruana_informatica',
  port: parseInt(process.env.SOURCE_DB_PORT || '3306')
};

// Base de datos de Peruana de Informática (donde importaremos)
const TARGET_DB = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'peruana_informatica',
  port: parseInt(process.env.DATABASE_PORT || '3306')
};

// ============================================
// SCRIPT DE IMPORTACIÓN
// ============================================

async function importProducts() {
  let sourceConn, targetConn;
  
  try {
    console.log('📡 Conectando a base de datos origen...');
    sourceConn = await mysql.createConnection(SOURCE_DB);
    
    console.log('📡 Conectando a Peruana de Informática...');
    targetConn = await mysql.createConnection(TARGET_DB);
    
    console.log('✅ Conexiones establecidas\n');
    
    // Obtener productos de tu sistema
    console.log('📦 Obteniendo productos...');
    const [products] = await sourceConn.execute(`
      SELECT 
        a.id,
        a.nombre,
        f.nombre AS nombre_familia,
        m.nombre AS nombre_marca,
        a.precio_venta AS valor_venta_base,
        a.precio_compra AS valor_compra_base,
        a.descripcion,
        a.stock AS stock_actual_empresa
      FROM articulos a
      LEFT JOIN familias f ON a.familia_id = f.id
      LEFT JOIN marcas m ON a.marca_id = m.id
      WHERE a.activo = 1
      LIMIT 10
    `);
    
    console.log(`✅ ${products.length} productos encontrados\n`);
    console.log('Mostrando primeros 3 productos:');
    console.log(products.slice(0, 3));
    
    await sourceConn.end();
    await targetConn.end();
    
    console.log('\n✅ Script ejecutado correctamente');
    console.log('📝 Revisa los datos arriba antes de importar masivamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

importProducts();
