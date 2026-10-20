import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Image } from '../models/Image';
import { sequelize } from '../database/connection';
import { logger } from '../config/logger';

export class ProductPublicController {
    async getSuggestions(req: Request, res: Response) {
        try {
            const q = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 5;
            const searchTerms = q.trim().split(/\s+/).filter(t => t.length > 0);

            if (searchTerms.length === 0) return res.json([]);

            const matchingBrands = await Brand.findAll({
                where: { name: { [Op.like]: `%${q}%` } },
                attributes: ['id']
            });
            const matchingBrandIds = matchingBrands.map(b => b.id);

            const products = await Product.findAll({
                where: {
                    is_active: 1,
                    stock: { [Op.gt]: 0 },
                    [Op.or]: [
                        { name: { [Op.like]: `%${q}%` } },
                        { category: { [Op.like]: `%${q}%` } },
                        { brand_id: { [Op.in]: matchingBrandIds } }
                    ]
                },
                attributes: ['cod_producto', 'name', 'slug', 'image', 'category', 'price', 'price_dis', 'price_web', 'price_cot'],
                limit: limit,
                order: [
                    [sequelize.literal(`CASE WHEN name LIKE :qprefix THEN 1 ELSE 2 END`), 'ASC'],
                    ['name', 'ASC']
                ],
                replacements: { qprefix: `${q}%` }
            });

            res.json(products);
        } catch (error) {
            logger.error('Error getting suggestions:', error);
            res.status(500).json({ error: 'Suggestion error' });
        }
    }

    async getPublicProducts(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 12;
            const offset = (page - 1) * limit;

            const where: any = {
                is_active: 1,
                stock: { [Op.gt]: 0 }
            };

            const categorySlug = req.query.category as string;
            const brandSlug = req.query.brand as string;
            const search = req.query.search as string;

            if (categorySlug) {
                const category = await Category.findOne({ where: { slug: categorySlug } });
                if (category) where.category_id = category.id;
            }

            if (brandSlug) {
                const brand = await Brand.findOne({ where: { slug: brandSlug } });
                if (brand) where.brand_id = brand.id;
            }

            if (search) {
                const searchTerms = search.trim().split(/\s+/);
                if (searchTerms.length > 0) {
                    where[Op.and] = searchTerms.map(term => ({
                        [Op.or]: [
                            { name: { [Op.like]: `%${term}%` } },
                            { description: { [Op.like]: `%${term}%` } },
                            { codigo_interno: { [Op.like]: `%${term}%` } },
                            { keywords: { [Op.like]: `%${term}%` } }
                        ]
                    }));
                }
            }

            if (req.query.featured === 'true') where.is_featured = true;
            if (req.query.new === 'true') where.is_new = true;
            if (req.query.clearance === 'true') where.is_clearance = true;

            const sortField = req.query.sort as string || 'cod_producto';
            const sortOrder = (req.query.order as string || 'desc').toUpperCase();
            const validSortFields: Record<string, string> = {
                'name': 'name',
                'price': 'price',
                'stock': 'stock',
                'cod_producto': 'cod_producto',
                'codigo_interno': 'codigo_interno'
            };
            const orderField = validSortFields[sortField] || 'cod_producto';
            const order: any = [[orderField, sortOrder === 'ASC' ? 'ASC' : 'DESC']];

            const { rows: products, count: total } = await Product.findAndCountAll({
                where,
                limit,
                offset,
                order,
                attributes: [
                    'cod_producto',
                    'name', 'slug', 'description', 'short_description', 'price', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'is_active', 'codigo_interno', 'component_type', 'is_featured', 'is_new', 'is_clearance'
                ],
                include: [
                    {
                        model: Brand,
                        as: 'productBrand',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Category,
                        as: 'productCategory',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Image,
                        as: 'images',
                        attributes: ['imagen'],
                        limit: 1,
                    }
                ]
            });

            res.json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            });
        } catch (error) {
            logger.error('Error getting public products:', error);
            res.status(500).json({ error: 'Error al obtener productos' });
        }
    }

    async getProductBySlug(req: Request, res: Response) {
        try {
            const product = await Product.findOne({
                where: { slug: req.params.slug, is_active: 1 },
                include: [
                    {
                        model: Brand,
                        as: 'productBrand',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Category,
                        as: 'productCategory',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Image,
                        as: 'images',
                        attributes: ['imagen'],
                    },
                    {
                        model: SubCategory,
                        as: 'subCategories',
                        through: { attributes: [] },
                        attributes: ['id', 'name', 'slug'],
                    }
                ]
            });

            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json(product);
        } catch (error) {
            logger.error('Error getting product by slug:', error);
            res.status(500).json({ error: 'Error al obtener producto' });
        }
    }

    async getPublicProductById(req: Request, res: Response) {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [
                    {
                        model: Brand,
                        as: 'productBrand',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Category,
                        as: 'productCategory',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Image,
                        as: 'images',
                        attributes: ['imagen'],
                    },
                    {
                        model: SubCategory,
                        as: 'subCategories',
                        through: { attributes: [] },
                        attributes: ['id', 'name', 'slug'],
                    }
                ]
            });

            if (!product || !product.is_active) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json(product);
        } catch (error) {
            logger.error('Error getting product by id:', error);
            res.status(500).json({ error: 'Error al obtener producto' });
        }
    }
}

export const productPublicController = new ProductPublicController();
