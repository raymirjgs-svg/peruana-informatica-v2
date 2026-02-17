import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SubCategory } from '../models/SubCategory';
import { ProductSubCategory } from '../models/ProductSubCategory';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../database/connection';
import { extractComponentSpecs } from '../utils/productSpecs';
import { sanitizeSlug } from '../utils/sanitize';

export const getLaptopsWithSubcategories = async (req: Request, res: Response) => {
  try {
    const { subcategory, minPrice, maxPrice, search } = req.query;

    let whereClause: any = {
      [Op.or]: [
        { category_id: 1 },
        { name: { [Op.like]: '%laptop%' } },
        { name: { [Op.like]: '%Laptop%' } }
      ],
      is_active: true,
      stock: { [Op.gt]: 0 }
    };

    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(maxPrice as string) };
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    let includeConditions: any = [
      {
        model: SubCategory,
        as: 'subCategories',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false
      }
    ];

    if (subcategory) {
      includeConditions[0].required = true;
      includeConditions[0].where = {
        slug: subcategory
      };
    }

    const { processor, ram, storage } = req.query;

    if (!whereClause[Op.and]) {
      whereClause[Op.and] = [];
    }

    const addSubcategoryFilter = (slug: string) => {
      const sanitizedSlug = sanitizeSlug(slug);

      whereClause[Op.and].push(Sequelize.literal(`
        EXISTS (
          SELECT 1
          FROM product_sub_categories psc
          JOIN sub_categories sc ON psc.sub_category_id = sc.id
          WHERE psc.product_codigo_interno = Product.codigo_interno
          AND sc.slug = ${sequelize.escape(sanitizedSlug)}
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

    const laptopsWithSpecs = laptops.map(laptop => {
      const laptopData: any = laptop.toJSON();

      if (laptopData.component_specs && Object.keys(laptopData.component_specs).length > 0) {
        return laptopData;
      }

      laptopData.component_specs = extractComponentSpecs(laptopData, true);
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
          is_active: true
        },
        required: true
      }],
      order: [['order', 'ASC']]
    });

    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching laptop subcategories:', error);
    res.json([]);
  }
};

// Shared helper for subcategory option queries
const getSubcategoryOptions = async (where: any, req: Request, res: Response) => {
  try {
    const options = await SubCategory.findAll({
      where: { ...where, is_active: true },
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
    console.error('Error fetching subcategory options:', error);
    res.json([]);
  }
};

export const getLaptopProcessors = async (req: Request, res: Response) => {
  await getSubcategoryOptions({ category_id: 8 }, req, res);
};

export const getLaptopRamOptions = async (req: Request, res: Response) => {
  await getSubcategoryOptions({ slug: { [Op.like]: '%ram%' } }, req, res);
};

export const getLaptopStorageOptions = async (req: Request, res: Response) => {
  await getSubcategoryOptions({ slug: { [Op.like]: '%ssd%' } }, req, res);
};
