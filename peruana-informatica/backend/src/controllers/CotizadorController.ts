import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SubCategory } from '../models/SubCategory';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../database/connection';
import { extractComponentSpecs } from '../utils/productSpecs';
import { getActivePriceColumn, getPriceField, getProductPrice } from '../utils/priceMapping';
import { sanitizeSlug } from '../utils/sanitize';

export const getCotizadorLaptops = async (req: Request, res: Response) => {
    try {
        const { subcategory, minPrice, maxPrice, search } = req.query;
        const activePriceCol = await getActivePriceColumn(); // e.g., 'pre_web', 'pre_cli', 'pre_dis'

        console.log('--- COTIZADOR DEBUG ---');
        console.log('Active Price Column Setting:', activePriceCol);

        const priceField = getPriceField(activePriceCol);

        console.log('Mapped Price Field for Sorting:', priceField);

        // Build filter conditions
        let whereClause: any = {
            [Op.or]: [
                { category_id: 1 },
                { name: { [Op.like]: '%laptop%' } },
                { name: { [Op.like]: '%Laptop%' } }
            ],
            is_active: true,
            stock: { [Op.gt]: 0 }
        };

        // Strict Price Filtering Logic
        // We ensure the selected price field exists and is greater than 0
        whereClause[priceField] = {
            [Op.and]: [
                { [Op.ne]: null },
                { [Op.gt]: 0 }
            ]
        };

        // Add ranges if specified, on the correct field
        if (minPrice) {
            whereClause[priceField] = { ...whereClause[priceField], [Op.gte]: parseFloat(minPrice as string) };
        }
        if (maxPrice) {
            whereClause[priceField] = { ...whereClause[priceField], [Op.lte]: parseFloat(maxPrice as string) };
        }

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // Subcategory Logic
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
            includeConditions[0].where = { slug: subcategory };
        }

        // Processor/RAM/Storage filters
        const { processor, ram, storage } = req.query;
        if (!whereClause[Op.and]) whereClause[Op.and] = [];

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
            order: [[priceField, 'ASC']] // Order by the active price
        });

        const laptopsWithDynamicPrice = laptops.map(laptop => {
            const laptopData: any = laptop.toJSON();

            // Swap price with the selected price type
            const finalPrice = getProductPrice(laptopData, activePriceCol);

            laptopData.price = finalPrice; // Overwrite the main price field for the frontend

            // Specs
            if (!laptopData.component_specs || Object.keys(laptopData.component_specs).length === 0) {
                laptopData.component_specs = extractComponentSpecs(laptopData);
            }
            return laptopData;
        });

        res.json(laptopsWithDynamicPrice);

    } catch (error: any) {
        console.error('Error fetching cotizador laptops:', error);
        res.status(500).json({ error: error.message });
    }
};
