// backend/scripts/importFromCSV.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_DB = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'peruana_informatica',
  port: parseInt(process.env.DATABASE_PORT || '3306')
};

function generateSlug(text, id) {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${id}`;
}

async function getOrCreateBrand(conn, brandName) {
  if (!brandName) return null;
  
  const slug = generateSlug(brandName, '');
  const [brands] = await conn.execute(
    'SELECT id FROM brands WHERE name = ?',
    [brandName]
  );
  
  if (brands.length > 0) return brands[0].id;
  
  const [result] = await conn.execute(
    'INSERT INTO brands (name, slug) VALUES (?, ?)',
    [brandName, slug]
  );
  return result.insertId;
}

async function getOrCreateCategory(conn, categoryName) {
  if (!categoryName) return null;
  
  const slug = generateSlug(categoryName, '');
  const [categories] = await conn.execute(
    'SELECT id FROM categories WHERE name = ?',
    [categoryName]
  );
  
  if (categories.length > 0) return categories[0].id;
  
  const [result] = await conn.execute(
    'INSERT INTO categories (name, slug, appears_in_menu) VALUES (?, ?, ?)',
    [categoryName, slug, true]
  );
  return result.insertId;
}

async function importFromCSV() {
  let connection;
  
  try {
    console.log('📄 Leyendo archivo CSV...\n');
    const fileContent = fs.readFileSync('./productos.csv', 'utf8');
    const { data } = Papa.parse(fileContent, { 
      header: true,
      skipEmptyLines: true 
    });
    
    console.log(`✅ ${data.length} productos encontrados en CSV\n`);
    
    console.log('⏳ Conectando a base de datos...');
    connection = await mysql.createConnection(TARGET_DB);
    console.log('✅ Conectado\n');
    
    const stats = { total: 0, success: 0, errors: 0, errorLog: [] };
    
    await connection.beginTransaction();
    
    for (const row of data) {
      stats.total++;
      
      try {
        // Solo usamos los campos esenciales
        const id = row.id;
        const nombre = row.nombre;
        const marca = row.nombre_marca;
        const categoria = row.nombre_familia;
        const precioVenta = parseFloat(row.valor_venta_base) || 0;
        const precioDistribucion = parseFloat(row.valor_compra_base) || 0;
        const stock = parseInt(row.stock_actual_empresa) || 0;
        const descripcion = row.descripcion || nombre;
        
        // Validación mínima
        if (!nombre || !id) {
          stats.errors++;
          stats.errorLog.push({ id, error: 'Sin nombre o ID' });
          continue;
        }
        
        // Crear o buscar marca y categoría
        const brandId = await getOrCreateBrand(connection, marca);
        const categoryId = await getOrCreateCategory(connection, categoria);
        const slug = generateSlug(nombre, id);
        
        // Insertar producto
        await connection.execute(`
          INSERT INTO products (
            name, slug, description, short_description,
            price, wholesale_price, stock,
            category, brand_id, category_id, keywords
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            price = VALUES(price),
            wholesale_price = VALUES(wholesale_price),
            stock = VALUES(stock),
            updated_at = CURRENT_TIMESTAMP
        `, [
          nombre,
          slug,
          descripcion,
          descripcion.substring(0, 200),
          precioVenta,
          precioDistribucion,
          stock,
          categoria || null,
          brandId,
          categoryId,
          `${nombre} ${marca || ''} ${categoria || ''}`.toLowerCase()
        ]);
        
        stats.success++;
        
        // Log cada 100 productos
        if (stats.success % 100 === 0) {
          console.log(`✅ Importados: ${stats.success}/${stats.total}`);
        }
        
      } catch (error) {
        stats.errors++;
        stats.errorLog.push({ 
          id: row.id, 
          nombre: row.nombre,
          error: error.message 
        });
      }
    }
    
    await connection.commit();
    
    console.log('\n📊 RESUMEN DE IMPORTACIÓN:');
    console.log(`   Total procesados: ${stats.total}`);
    console.log(`   ✅ Exitosos: ${stats.success}`);
    console.log(`   ❌ Errores: ${stats.errors}\n`);
    
    if (stats.errorLog.length > 0) {
      fs.writeFileSync('./errores_importacion.json', JSON.stringify(stats.errorLog, null, 2));
      console.log('📝 Errores guardados en: errores_importacion.json\n');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (connection) await connection.rollback();
  } finally {
    if (connection) await connection.end();
  }
}

importFromCSV();