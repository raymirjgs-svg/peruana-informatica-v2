import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product } from '../../models/Product';
import { Brand } from '../../models/Brand';
import { Category } from '../../models/Category';
import { SubCategory } from '../../models/SubCategory';
import { ProductSubCategory } from '../../models/ProductSubCategory';
import { Image } from '../../models/Image';
import { sequelize } from '../../database/connection';
import { createProductRecord } from '../../services/productRecordService';
import { logger } from '../../config/logger';
import { sendError } from '../../middleware/errorHandler';

export class ProductController {
    async getProducts(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const where: any = {};

            // Búsqueda inteligente (Smart Search)
            if (req.query.search) {
                const searchTerms = (req.query.search as string).trim().split(/\s+/); // Split by whitespace

                if (searchTerms.length > 0) {
                    // El producto debe coincidir con TODOS los términos de búsqueda (AND implícito entre términos)
                    // Pero cada término puede estar en CUALQUIERA de los campos (OR entre campos)
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

            // Búsqueda por código interno
            if (req.query.codigo) {
                where.codigo_interno = {
                    [Op.like]: `%${req.query.codigo}%`
                };
            }

            if (req.query.category) {
                where.category_id = req.query.category;
            }

            if (req.query.brand) {
                where.brand_id = req.query.brand;
            }

            // Filtro de stock
            if (req.query.stock_filter) {
                switch (req.query.stock_filter) {
                    case 'available':
                        where.stock = { [Op.gt]: 0 };
                        break;
                    case 'low':
                        where.stock = { [Op.and]: [{ [Op.gt]: 0 }, { [Op.lte]: 10 }] };
                        break;
                    case 'out':
                        where.stock = 0;
                        break;
                }
            }

            // Ordenamiento
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
                        attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
                        required: false,
                    }
                ]
            });

            // Mapear resultados para incluir 'id' como alias de 'cod_producto'
            const mappedProducts = products.map(p => {
                const json = p.toJSON();
                return {
                    ...json,
                    id: p.cod_producto // Alias manual
                };
            });

            res.json({
                products: mappedProducts,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                filters: {
                    search: req.query.search || null,
                    category: req.query.category || null,
                    brand: req.query.brand || null,
                }
            });
        } catch (error) {
            logger.error('Error getting products:', error);
            return sendError(res, error, 'Error al obtener productos', 500, 'PRODUCTS_FETCH_ERROR');
        }
    }

    async getProductById(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findOne({
                where: { cod_producto: productId },
                attributes: [
                    'cod_producto',
                    'name', 'slug', 'description', 'short_description', 'price', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'is_active', 'codigo_interno', 'component_type', 'is_featured', 'is_new', 'is_clearance',
                    'seo_title', 'seo_description'
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
                        model: SubCategory,
                        as: 'subCategories',
                        attributes: ['id', 'name', 'slug'],
                        through: { attributes: [] }
                    },
                    {
                        model: Image,
                        as: 'images',
                        attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
                        required: false,
                    }
                ]
            });

            if (!product) {
                return res.status(404).json({
                    error: 'Producto no encontrado',
                    code: 'PRODUCT_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Incluir alias id
            const json = product.toJSON();
            // @ts-ignore
            res.json({ ...json, id: product.cod_producto, subcategory_ids: json.subCategories?.map((s: any) => s.id) || [] });
        } catch (error) {
            logger.error('Error getting product:', error);
            return sendError(res, error, 'Error al obtener producto', 500, 'PRODUCT_FETCH_ERROR');
        }
    }

    async createProduct(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        try {
            const product = await createProductRecord(req.body, transaction);

            await transaction.commit();

            const newProduct = await Product.findByPk(product.cod_producto, {
                include: [
                    { model: Brand, as: 'productBrand', attributes: ['id', 'name', 'slug'] },
                    { model: Category, as: 'productCategory', attributes: ['id', 'name', 'slug'] },
                    { model: SubCategory, as: 'subCategories', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
                    { model: Image, as: 'images', attributes: ['cod_galeria', 'codigo_interno', 'imagen'], required: false }
                ]
            });

            res.status(201).json(newProduct);
        } catch (error: any) {
            await transaction.rollback();

            if (error?.code === 'DUPLICATE_CODIGO_INTERNO') {
                return res.status(409).json({
                    error: 'Error interno',
                    code: 'DUPLICATE_CODIGO_INTERNO',
                    timestamp: new Date().toISOString()
                });
            }

            logger.error('Error creating product:', error);
            return sendError(res, error, 'Error al crear producto', 500, 'PRODUCT_CREATION_ERROR');
        }
    }

    async updateProduct(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        try {
            const productId = parseInt(req.params.id as string);
            const { subcategory_ids } = req.body;

            const product = await Product.findByPk(productId, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            const allowedFields = [
                'name',
                'description',
                'short_description',
                'price',
                'price_dis',
                'price_cot',
                'price_web',
                'stock',
                'image',
                'keywords',
                'brand_id',
                'category_id',
                'is_active',
                'estado',
                'seo_title',
                'seo_description',
                'component_type',
                'socket_type',
                'ram_type',
                'form_factor',
                'tdp_watts',
                'has_integrated_graphics',
                'component_specs',
                'is_featured',
                'is_new',
                'is_clearance'
            ];
            const updates: any = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            await product.update(updates, { transaction });

            // Actualizar subcategorías si se proporcionan
            if (subcategory_ids && Array.isArray(subcategory_ids)) {
                if (product.codigo_interno) {
                    await ProductSubCategory.destroy({
                        where: { product_codigo_interno: product.codigo_interno },
                        transaction
                    });

                    if (subcategory_ids.length > 0) {
                        const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                            product_codigo_interno: product.codigo_interno,
                            sub_category_id: subId
                        }));
                        await ProductSubCategory.bulkCreate(subcategoryRecords, { transaction });
                    }
                }
            }

            await transaction.commit();

            res.json(product);
        } catch (error) {
            await transaction.rollback();
            logger.error('Error updating product:', error);
            return sendError(res, error, 'Error al actualizar producto');
        }
    }

    async toggleActive(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            await product.update({ is_active: !product.is_active });
            res.json({
                message: `Producto ${product.is_active ? 'activado' : 'desactivado'} correctamente`,
                is_active: product.is_active
            });
        } catch (error) {
            logger.error('Error toggling product status:', error);
            return sendError(res, error, 'Error al cambiar estado del producto');
        }
    }

    async deleteProduct(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findByPk(productId, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            // Eliminar imágenes asociadas primero
            if (product.codigo_interno) {
                await Image.destroy({
                    where: { codigo_interno: product.codigo_interno },
                    transaction
                });

                await ProductSubCategory.destroy({
                    where: { product_codigo_interno: product.codigo_interno },
                    transaction
                });
            }

            // Eliminar el producto
            await product.destroy({ transaction });

            await transaction.commit();

            res.json({
                message: 'Producto eliminado correctamente',
                id: productId
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Error deleting product:', error);
            return sendError(res, error, 'Error al eliminar producto');
        }
    }
}

export const productController = new ProductController();
