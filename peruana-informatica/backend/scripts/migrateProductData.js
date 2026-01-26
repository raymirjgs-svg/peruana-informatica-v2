/**
 * Script para migrar imágenes y descripciones de productos
 * desde c2731212_web2.sql a peruana_informatica.sql
 */

const fs = require('fs');
const path = require('path');

// Configuración
const OLD_DB_FILE = path.join(__dirname, '../../c2731212_web2.sql');
const NEW_DB_FILE = path.join(__dirname, '../../peruana_informatica.sql');
const OUTPUT_FILE = path.join(__dirname, '../../peruana_informatica_updated.sql');

console.log('🚀 Iniciando migración de datos...');

// Leer archivos
console.log('📖 Leyendo archivos...');
const oldDbContent = fs.readFileSync(OLD_DB_FILE, 'utf8');
const newDbContent = fs.readFileSync(NEW_DB_FILE, 'utf8');

// Extraer datos de productos de la base antigua
console.log('🔍 Extrayendo datos de productos antiguos...');
const productsOld = extractOldProducts(oldDbContent);
console.log(`✅ Encontrados ${productsOld.length} productos en la base antigua`);

// Extraer galería de imágenes
console.log('🖼️  Extrayendo imágenes de productos...');
const imagesOld = extractProductImages(oldDbContent);
console.log(`✅ Encontradas ${imagesOld.length} imágenes en la galería`);

// Extraer datos de productos de la base nueva
console.log('🔍 Extrayendo datos de productos nuevos...');
const productsNew = extractNewProducts(newDbContent);
console.log(`✅ Encontrados ${productsNew.length} productos en la base nueva`);

// Hacer matching y actualizar
console.log('🔄 Buscando coincidencias y actualizando...');
let updated = 0;
let notFound = 0;

const updatedProducts = productsNew.map(product => {
  // Buscar coincidencia por nombre (normalizado)
  const normalizedName = normalizeProductName(product.name);
  
  const match = productsOld.find(p => 
    matchesProductName(normalizedName, normalizeProductName(p.nombre_producto))
  );
  
  if (match) {
    // Actualizar descripción e imagen
    const descripcion = match.descripcion || product.description;
    const imagen = imagesOld[match.cod_producto] 
      ? `/images/products/${imagesOld[match.cod_producto]}` 
      : product.image;
    
    updated++;
    return {
      ...product,
      description: descripcion,
      image: imagen,
      codigo_interno: match.codigo_interno
    };
  } else {
    notFound++;
    return product;
  }
});

console.log(`✅ Actualizados: ${updated} productos`);
console.log(`⚠️  No encontrados: ${notFound} productos`);

// Generar nuevo archivo SQL
console.log('💾 Generando archivo SQL actualizado...');
generateUpdatedSQL(newDbContent, updatedProducts);

console.log('🎉 Migración completada!');
console.log(`📁 Archivo generado: ${OUTPUT_FILE}`);

// Funciones auxiliares
function extractOldProducts(content) {
  const products = [];
  const regex = /INSERT INTO `productos`.*?VALUES\s*\((.*?)\);?/gs;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const values = match[1];
    const lines = values.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      try {
        const product = parseOldProductInsert(line);
        if (product && product.codigo_interno) {
          products.push(product);
        }
      } catch (e) {
        // Ignorar líneas con error
      }
    }
  }
  
  return products;
}

function parseOldProductInsert(line) {
  // Extraer los campos del INSERT
  const match = line.match(/\((\d+).*?'([^']*)',.*?'([^']*)',.*?'([^']*)'.*?'([^']*)'.*?\)/);
  
  if (!match) return null;
  
  const [, cod_producto, , , , codigo_interno, nombre_producto] = line.match(/\((\d+).*?'([^']*)',.*?'([^']*)',.*?'([^']*)',.*?'([^']*)'.*?'([^']*)'.*?\)/);
  
  // Extraer descripción (puede estar en diferentes posiciones)
  const descripcionMatch = line.match(/'([^']*)',\s*(?:NULL|<.*?>.*?)'\s*(?:NULL|<.*?>.*?)'\s*(\d+)/);
  const descripcion = descripcionMatch ? descripcionMatch[2] : '';
  
  return {
    cod_producto: parseInt(cod_producto),
    codigo_interno: codigo_interno,
    nombre_producto: nombre_producto,
    descripcion: extractDescription(line)
  };
}

function extractDescription(line) {
  // Buscar el campo descripción que contiene HTML/rich text
  const descMatch = line.match(/`descripcion`\s*text[^,]*,\s*([^,]+)/);
  if (descMatch) {
    const content = descMatch[1].trim();
    if (content !== 'NULL' && content.length > 50) {
      return content.replace(/^'|'$/g, '');
    }
  }
  return '';
}

function extractProductImages(content) {
  const images = {};
  const regex = /INSERT INTO `galeria_productos`.*?VALUES\s*\((.*?)\);?/gs;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const values = match[1];
    const lines = values.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      // Parsear línea: (id, cod_producto, 'imagen')
      const imgMatch = line.match(/\((\d+),\s*(\d+),\s*'([^']+)'\)/);
      if (imgMatch) {
        const [, , cod_producto, imagen] = imgMatch;
        images[parseInt(cod_producto)] = imagen;
      }
    }
  }
  
  return images;
}

function extractNewProducts(content) {
  const products = [];
  const regex = /INSERT INTO `products`.*?VALUES\s*\((.*?)\);?/gs;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const values = match[1];
    const lines = values.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      try {
        const product = parseNewProductInsert(line);
        if (product) {
          products.push(product);
        }
      } catch (e) {
        // Ignorar líneas con error
      }
    }
  }
  
  return products;
}

function parseNewProductInsert(line) {
  // Formato: (id, 'name', 'slug', 'description', 'short_description', price, ...)
  const match = line.match(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/);
  
  if (!match) return null;
  
  const [, id, name, slug] = match;
  const descStartIndex = line.indexOf("', '") + 4;
  const descEndIndex = line.indexOf("', ", descStartIndex);
  const description = line.substring(descStartIndex, descEndIndex).trim();
  
  // Extraer image
  const imageMatch = line.match(/'([^']+)',\s*'([^']+)',\s*'/);
  const image = imageMatch ? imageMatch[1] : '';
  
  return {
    id: parseInt(id),
    name: name,
    slug: slug,
    description: description,
    image: image
  };
}

function normalizeProductName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Multiple spaces to one
    .trim();
}

function matchesProductName(name1, name2) {
  // Comparar los primeros N palabras significativas
  const words1 = name1.split(' ').filter(w => w.length > 3).slice(0, 5);
  const words2 = name2.split(' ').filter(w => w.length > 3).slice(0, 5);
  
  const commonWords = words1.filter(w => words2.includes(w));
  return commonWords.length >= 3; // Al menos 3 palabras en común
}

function generateUpdatedSQL(content, updatedProducts) {
  // Reemplazar la sección de INSERT de productos
  let newContent = content;
  
  // Construir nuevo INSERT
  const newInsert = buildProductsInsert(updatedProducts);
  
  // Reemplazar el INSERT original
  const regex = /INSERT INTO `products`[^;]*;/gs;
  newContent = content.replace(regex, newInsert);
  
  // Agregar campo codigo_interno si no existe
  const createTableRegex = /CREATE TABLE `products`/;
  if (!content.includes('codigo_interno')) {
    newContent = newContent.replace(
      createTableRegex,
      match => match + "\n  `codigo_interno` varchar(50) DEFAULT NULL,"
    );
  }
  
  fs.writeFileSync(OUTPUT_FILE, newContent);
  console.log('✅ Archivo SQL actualizado guardado');
}

function buildProductsInsert(products) {
  let insert = "INSERT INTO `products` (`id`, `name`, `slug`, `description`, `short_description`, `price`, `wholesale_price`, `stock`, `category`, `brand_id`, `category_id`, `image`, `keywords`, `created_at`, `updated_at`, `is_active`, `seo_title`, `seo_description`, `codigo_interno`) VALUES\n";
  
  const lines = products.map(p => {
    const escDesc = p.description.replace(/'/g, "''");
    return `(${p.id}, '${p.name}', '${p.slug}', '${escDesc}', '${p.short_description || ''}', ${p.price}, ${p.wholesale_price || 'NULL'}, ${p.stock}, '${p.category}', ${p.brand_id || 'NULL'}, ${p.category_id || 'NULL'}, '${p.image}', '${p.keywords || ''}', '${p.created_at}', '${p.updated_at}', ${p.is_active}, ${p.seo_title || 'NULL'}, ${p.seo_description || 'NULL'}, '${p.codigo_interno || ''}')`;
  });
  
  insert += lines.join(',\n') + ';';
  
  return insert;
}

