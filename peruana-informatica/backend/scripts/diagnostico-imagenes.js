/**
 * Script de diagnóstico para verificar el estado de las imágenes de productos
 * 
 * Este script verifica:
 * 1. Qué imágenes hay en la base de datos
 * 2. Qué archivos existen físicamente
 * 3. Qué productos tienen imágenes asociadas
 * 4. La relación entre productos e imágenes
 * 
 * Uso: node scripts/diagnostico-imagenes.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'prueba',
};

const IMAGES_DIR = path.join(__dirname, '../public/images/products');

async function diagnosticarImagenes() {
  let connection;
  
  try {
    console.log('🔍 Iniciando diagnóstico de imágenes...\n');
    console.log('📊 Configuración de base de datos:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}\n`);
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión a la base de datos establecida\n');
    
    // 1. Verificar estructura de tablas
    console.log('📋 1. Verificando estructura de tablas...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('products', 'img_products')
    `, [config.database]);
    
    console.log(`   Tablas encontradas: ${tables.map(t => t.TABLE_NAME).join(', ')}\n`);
    
    // 2. Contar productos
    console.log('📦 2. Analizando productos...');
    const [productCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM products
    `);
    console.log(`   Total de productos: ${productCount[0].total}`);
    
    const [productsWithImage] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE imagen IS NOT NULL AND imagen != ''
    `);
    console.log(`   Productos con imagen principal: ${productsWithImage[0].total}`);
    
    const [activeProducts] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE estado = 1
    `);
    console.log(`   Productos activos: ${activeProducts[0].total}\n`);
    
    // 3. Analizar imágenes en img_products
    console.log('🖼️  3. Analizando imágenes en img_products...');
    const [imageCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM img_products
    `);
    console.log(`   Total de imágenes: ${imageCount[0].total}`);
    
    const [imagesWithProduct] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM img_products 
      WHERE cod_producto IS NOT NULL
    `);
    console.log(`   Imágenes con producto asociado: ${imagesWithProduct[0].total}`);
    
    const [imagesWithoutProduct] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM img_products 
      WHERE cod_producto IS NULL
    `);
    console.log(`   Imágenes sin producto asociado: ${imagesWithoutProduct[0].total}\n`);
    
    // 4. Verificar relación productos-imágenes
    console.log('🔗 4. Verificando relación productos-imágenes...');
    const [relationship] = await connection.execute(`
      SELECT 
        p.cod_producto,
        p.nombre_producto,
        p.imagen as imagen_principal,
        COUNT(i.cod_galeria) as total_imagenes
      FROM products p
      LEFT JOIN img_products i ON p.cod_producto = i.cod_producto
      GROUP BY p.cod_producto, p.nombre_producto, p.imagen
      ORDER BY total_imagenes DESC
      LIMIT 10
    `);
    
    console.log('   Top 10 productos con más imágenes:');
    relationship.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nombre_producto} (ID: ${row.cod_producto})`);
      console.log(`      Imagen principal: ${row.imagen_principal || 'N/A'}`);
      console.log(`      Imágenes en galería: ${row.total_imagenes}`);
    });
    console.log('');
    
    // 5. Verificar archivos físicos
    console.log('📁 5. Verificando archivos físicos...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.log(`   ❌ Directorio no existe: ${IMAGES_DIR}`);
      console.log(`   💡 Crea el directorio o verifica la ruta\n`);
    } else {
      const files = fs.readdirSync(IMAGES_DIR);
      const imageFiles = files.filter(f => 
        ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase())
      );
      console.log(`   Directorio: ${IMAGES_DIR}`);
      console.log(`   Total de archivos: ${files.length}`);
      console.log(`   Archivos de imagen: ${imageFiles.length}`);
      console.log(`   Otros archivos: ${files.length - imageFiles.length}\n`);
      
      // 6. Comparar imágenes en BD vs archivos físicos
      console.log('🔄 6. Comparando imágenes en BD vs archivos físicos...');
      const [allImages] = await connection.execute(`
        SELECT DISTINCT imagen 
        FROM img_products 
        WHERE imagen IS NOT NULL AND imagen != ''
        LIMIT 50
      `);
      
      let found = 0;
      let notFound = 0;
      const notFoundImages = [];
      
      for (const row of allImages) {
        const imagePath = path.join(IMAGES_DIR, row.imagen);
        if (fs.existsSync(imagePath)) {
          found++;
        } else {
          notFound++;
          if (notFoundImages.length < 10) {
            notFoundImages.push(row.imagen);
          }
        }
      }
      
      console.log(`   Imágenes encontradas: ${found}`);
      console.log(`   Imágenes no encontradas: ${notFound}`);
      if (notFoundImages.length > 0) {
        console.log(`   Ejemplos de imágenes no encontradas:`);
        notFoundImages.forEach(img => {
          console.log(`      - ${img}`);
        });
      }
      console.log('');
    }
    
    // 7. Productos sin imágenes
    console.log('⚠️  7. Productos sin imágenes...');
    const [productsWithoutImages] = await connection.execute(`
      SELECT 
        p.cod_producto,
        p.nombre_producto,
        p.estado
      FROM products p
      LEFT JOIN img_products i ON p.cod_producto = i.cod_producto
      WHERE (p.imagen IS NULL OR p.imagen = '')
      AND i.cod_galeria IS NULL
      AND p.estado = 1
      LIMIT 10
    `);
    
    console.log(`   Productos activos sin imágenes: ${productsWithoutImages.length}`);
    if (productsWithoutImages.length > 0) {
      console.log(`   Ejemplos:`);
      productsWithoutImages.forEach((row, index) => {
        console.log(`      ${index + 1}. ${row.nombre_producto} (ID: ${row.cod_producto})`);
      });
    }
    console.log('');
    
    // 8. Resumen y recomendaciones
    console.log('📝 8. Resumen y recomendaciones:');
    console.log('');
    console.log('   ✅ Verificaciones completadas');
    console.log('   💡 Recomendaciones:');
    console.log('      1. Asegúrate de que las imágenes estén en: backend/public/images/products/');
    console.log('      2. Verifica que los nombres de archivo en la BD coincidan con los archivos físicos');
    console.log('      3. Usa el endpoint /api/debug/images para verificar imágenes en tiempo real');
    console.log('      4. Revisa la consola del navegador para ver errores de carga de imágenes');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('   Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexión cerrada');
    }
  }
}

// Ejecutar diagnóstico
diagnosticarImagenes().catch(console.error);

