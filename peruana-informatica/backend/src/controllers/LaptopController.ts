import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SubCategory } from '../models/SubCategory';
import { ProductSubCategory } from '../models/ProductSubCategory';
import { Op, Sequelize } from 'sequelize';
// Fixed type field usage

// Helper function to extract component specs from product description
const extractComponentSpecs = (product: any) => {
  // This is a simplified implementation - in a real scenario, you'd want to parse
  // the product description or have a separate table for component specifications
  const description = product.description || '';

  // Remove HTML tags from description for better parsing
  const cleanDescription = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // More precise regex patterns to extract common specs
  // Processor patterns
  let processor = 'No especificado';
  const processorPatterns = [
    /(Intel\s+Core\s+i[3579]-?\d+[A-Z]*)/i,
    /(AMD\s+Ryzen\s+\d+\s*\d*)/i,
    /(Intel\s+Celeron|Intel\s+Pentium)/i,
    /(Apple\s+M\d+\s+Chip)/i,
    /(Intel\s+Core)/i,
    /(AMD\s+Ryzen)/i
  ];

  for (const pattern of processorPatterns) {
    const match = cleanDescription.match(pattern);
    if (match) {
      processor = match[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // RAM patterns
  let ram = 'No especificado';
  const ramMatch = cleanDescription.match(/(\d+)\s*(GB|GB DDR4|GB DDR5|GB RAM)/i);
  if (ramMatch) {
    ram = ramMatch[0].trim();
  }

  // Storage patterns
  let storage = 'No especificado';
  const storagePatterns = [
    /(\d+)\s*(GB|TB)\s*(SSD|HDD|NVMe)/i,
    /Disco\s+S[oó]lido\s+de\s+(\d+)\s*(GB|TB)/i,
    /(\d+)\s*(GB|TB)\s+de\s+almacenamiento/i
  ];

  for (const pattern of storagePatterns) {
    const match = cleanDescription.match(pattern);
    if (match) {
      storage = match[0].replace(/Disco\s+S[oó]lido\s+de\s+/i, '').replace(/de\s+almacenamiento/i, '').trim();
      break;
    }
  }

  // Graphics
  let graphics = 'No especificado';
  if (cleanDescription.includes('GTX') || cleanDescription.includes('RTX')) {
    graphics = 'Dedicada';
  } else if (cleanDescription.includes('Intel') || cleanDescription.includes('AMD') || cleanDescription.includes('integrada')) {
    graphics = 'Integrada';
  }

  // Screen size
  let screenSize = 'No especificado';
  const screenMatch = cleanDescription.match(/(\d+\.?\d*)["”]/);
  if (screenMatch) {
    screenSize = screenMatch[0];
  }

  return {
    processor,
    ram,
    storage,
    graphics,
    screen_size: screenSize
  };
};

export const getLaptopsWithSubcategories = async (req: Request, res: Response) => {
  try {
    const { subcategory, minPrice, maxPrice, search } = req.query;

    // Build filter conditions - buscar laptops por nombre o categoría
    let whereClause: any = {
      [Op.or]: [
        { category_id: 1 }, // Laptops category
        { name: { [Op.like]: '%laptop%' } }, // Productos cuyo nombre contenga 'laptop'
        { name: { [Op.like]: '%Laptop%' } }  // Considerar mayúsculas
      ],
      is_active: true, // Only active products
      stock: { [Op.gt]: 0 } // Only products with stock > 0
    };

    // Add price filters
    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(maxPrice as string) };
    }

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Build include conditions for subcategories
    let includeConditions: any = [
      {
        model: SubCategory,
        as: 'subCategories',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] }, // Don't include the junction table attributes
        required: false // LEFT JOIN para incluir productos incluso si no tienen subcategorías
      }
    ];

    // If filtering by specific subcategory
    if (subcategory) {
      // Cuando se filtra por subcategoría específica, hacer INNER JOIN
      includeConditions[0].required = true;
      includeConditions[0].where = {
        slug: subcategory
      };
    }

    // Filter by Processor, RAM, Storage (if provided as slugs)
    const { processor, ram, storage } = req.query;

    // Initialize Op.and if it doesn't exist, to combine conditions
    if (!whereClause[Op.and]) {
      whereClause[Op.and] = [];
    }

    // Helper to add subcategory filter using EXISTS subquery
    // This avoids duplicate alias issues with multiple includes and ensures AND logic
    const addSubcategoryFilter = (slug: string) => {
      // Sanitize slug to prevent SQL injection (basic check)
      const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-]/g, '');

      whereClause[Op.and].push(Sequelize.literal(`
        EXISTS (
          SELECT 1 
          FROM product_sub_categories psc
          JOIN sub_categories sc ON psc.sub_category_id = sc.id
          WHERE psc.product_codigo_interno = Product.codigo_interno
          AND sc.slug = '${sanitizedSlug}'
        )
      `));
    };

    if (processor) addSubcategoryFilter(processor as string);
    if (ram) addSubcategoryFilter(ram as string);
    if (storage) addSubcategoryFilter(storage as string);

    const laptops = await Product.findAll({
      where: whereClause,
      include: includeConditions,
      order: [['price', 'ASC']]
    });

    // Add component specs to each laptop
    const laptopsWithSpecs = laptops.map(laptop => {
      const laptopData: any = laptop.toJSON();

      // Prioritize DB specs if they exist and have data
      if (laptopData.component_specs && Object.keys(laptopData.component_specs).length > 0) {
        return laptopData;
      }

      // Fallback to extraction from description
      laptopData.component_specs = extractComponentSpecs(laptopData);
      return laptopData;
    });

    res.json(laptopsWithSpecs);
  } catch (error) {
    console.error('Error fetching laptops with subcategories:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getLaptopSubcategories = async (req: Request, res: Response) => {
  try {
    // Get subcategories that belong to the 'Laptops' category and have associated products
    // Assuming category_id 1 is for laptops, or you can query by category slug/name
    const subcategories = await SubCategory.findAll({
      where: {
        category_id: 1,
        is_active: true
      },
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: [],
        where: {
          is_active: true // Only active products
        },
        required: true // INNER JOIN to only get subcategories with products
      }],
      order: [['order', 'ASC']]
    });

    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching laptop subcategories:', error);
    // Si no hay subcategorías con laptops, devolver lista vacía sin error
    res.json([]);
  }
};

// New function to get standardized processor options
export const getLaptopProcessors = async (req: Request, res: Response) => {
  try {
    // Get all processor subcategories that have associated products
    // Assuming there's a 'Procesadores' category - adjust category_id as needed
    const processors = await SubCategory.findAll({
      where: {
        slug: { [Op.like]: '%procesador%' },
        is_active: true
      },
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: [],
        where: {
          is_active: true // Only active products
        },
        required: true // INNER JOIN to only get processors with products
      }],
      order: [['order', 'ASC']],
    });

    res.json(processors);
  } catch (error) {
    console.error('Error fetching laptop processors:', error);
    res.json([]);
  }
};

export const getLaptopRamOptions = async (req: Request, res: Response) => {
  try {
    const options = await SubCategory.findAll({
      where: { slug: { [Op.like]: '%ram%' }, is_active: true },
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: [],
        where: { is_active: true },
        required: true
      }],
      order: [['order', 'ASC']]
    });
    res.json(options);
  } catch (error) {
    console.error('Error fetching laptop RAM options:', error);
    res.json([]);
  }
};

export const getLaptopStorageOptions = async (req: Request, res: Response) => {
  try {
    const options = await SubCategory.findAll({
      where: { slug: { [Op.like]: '%almacenamiento%' }, is_active: true },
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: [],
        where: { is_active: true },
        required: true
      }],
      order: [['order', 'ASC']]
    });
    res.json(options);
  } catch (error) {
    console.error('Error fetching laptop storage options:', error);
    res.json([]);
  }
};
