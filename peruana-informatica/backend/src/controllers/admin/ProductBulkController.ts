import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product } from '../../models/Product';
import { ProductSubCategory } from '../../models/ProductSubCategory';
import { sequelize } from '../../database/connection';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';
import { createProductRecord } from '../../services/productRecordService';
import { logger } from '../../config/logger';
import { sendError } from '../../middleware/errorHandler';

export class ProductBulkController {
    async importJson(req: Request, res: Response) {
        try {
            const payload = req.body;
            const items = Array.isArray(payload)
                ? payload
                : (Array.isArray(payload?.products) ? payload.products : null);

            if (!items) {
                return res.status(400).json({
                    error: 'El cuerpo debe ser un array de productos o un objeto con la propiedad "products"',
                    code: 'INVALID_IMPORT_PAYLOAD'
                });
            }

            const success: any[] = [];
            const updated: any[] = [];
            const errors: any[] = [];

            for (const raw of items) {
                const codigo = raw?.codigo_interno ?? raw?.codigo ?? null;
                const name = raw?.name ?? raw?.nombre ?? null;

                if (!name) {
                    errors.push({ codigo: codigo ?? 'sin_codigo', error: 'El nombre del producto es requerido' });
                    continue;
                }

                const data = {
                    name,
                    description: raw?.description ?? raw?.descripcion ?? name,
                    price: raw?.price ?? raw?.precio ?? raw?.pre_cli ?? 0,
                    stock: raw?.stock ?? 0,
                    category_id: raw?.category_id,
                    brand_id: raw?.brand_id,
                    image: raw?.image,
                    keywords: raw?.keywords,
                    component_type: raw?.component_type,
                    additional_images: raw?.additional_images,
                    subcategory_ids: raw?.subcategory_ids,
                    codigo_interno: codigo ?? undefined,
                    seo_title: raw?.seo_title,
                    seo_description: raw?.seo_description
                };

                const transaction = await sequelize.transaction();
                try {
                    const product = await createProductRecord(data, transaction);
                    await transaction.commit();
                    success.push({
                        codigo: product.codigo_interno,
                        productId: product.cod_producto,
                        name: product.name
                    });
                } catch (error: any) {
                    await transaction.rollback();
                    errors.push({
                        codigo: codigo ?? 'sin_codigo',
                        error: error?.message || 'Error al crear producto'
                    });
                }
            }

            res.status(201).json({
                message: `Importación completada: ${success.length} creados, ${errors.length} errores`,
                summary: {
                    total: items.length,
                    creados: success.length,
                    actualizados: updated.length,
                    errores: errors.length
                },
                details: {
                    success,
                    updated,
                    errors
                }
            });
        } catch (error) {
            logger.error('Error importing products:', error);
            return sendError(res, error, 'Error al importar productos', 500, 'PRODUCT_IMPORT_ERROR');
        }
    }

    async bulkUpdate(req: Request, res: Response) {
        try {
            const { product_ids, subcategory_ids, ...updates } = req.body;

            // Filtrar campos permitidos para actualización masiva
            const allowedFields = ['category_id', 'brand_id', 'component_type', 'socket_type', 'ram_type', 'form_factor'];
            const cleanUpdates: any = {};

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key) && updates[key] !== undefined) {
                    cleanUpdates[key] = updates[key];
                }
            });

            let updatedCount = 0;

            // Actualizar campos de producto si hay alguno
            if (Object.keys(cleanUpdates).length > 0) {
                const [count] = await Product.update(cleanUpdates, {
                    where: {
                        cod_producto: {
                            [Op.in]: product_ids
                        }
                    }
                });
                updatedCount = count;
            }

            // Actualizar subcategorías si se proporcionaron
            if (subcategory_ids && Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
                // Obtener los productos con sus codigo_interno
                const products = await Product.findAll({
                    where: {
                        cod_producto: {
                            [Op.in]: product_ids
                        }
                    },
                    attributes: ['cod_producto', 'codigo_interno']
                });

                // Para cada producto, eliminar sus subcategorías actuales y agregar las nuevas
                for (const product of products) {
                    if (product.codigo_interno) {
                        // Eliminar subcategorías existentes
                        await ProductSubCategory.destroy({
                            where: {
                                product_codigo_interno: product.codigo_interno
                            }
                        });

                        // Agregar nuevas subcategorías
                        const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                            product_codigo_interno: product.codigo_interno,
                            sub_category_id: subId
                        }));

                        await ProductSubCategory.bulkCreate(subcategoryRecords, {
                            ignoreDuplicates: true
                        });
                    }
                }

                // Si no hubo actualizaciones de campos, contar productos actualizados por subcategorías
                if (updatedCount === 0) {
                    updatedCount = products.length;
                }
            }

            if (Object.keys(cleanUpdates).length === 0 && (!subcategory_ids || subcategory_ids.length === 0)) {
                return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
            }

            res.json({
                message: 'Actualización masiva completada',
                updated: updatedCount
            });
        } catch (error) {
            logger.error('Error in bulk update:', error);
            return sendError(res, error, 'Error al actualizar productos en bloque');
        }
    }

    async syncAll(req: Request, res: Response) {
        try {
            // Obtener todos los productos
            const allProducts = await Product.findAll({
                attributes: ['cod_producto', 'codigo_interno', 'price', 'stock']
            });

            // Filtrar productos con código interno
            const products = allProducts.filter(p => p.codigo_interno && p.codigo_interno.trim() !== '');

            let updated = 0;
            let errors = 0;

            // Sincronizar cada producto
            for (const product of products) {
                try {
                    const erpResult = await PeruanaInformaticaService.consultarArticulo(String(product.codigo_interno));

                    if (erpResult && erpResult.success && erpResult.data) {
                        const articulo = erpResult.data;
                        const newStock = parseInt(articulo.stock) || 0;
                        const newPrice = parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.precio) || parseFloat(articulo.pre_cli) || product.price;

                        await Product.update(
                            { stock: newStock, price: newPrice },
                            { where: { cod_producto: product.cod_producto } }
                        );
                        updated++;
                    }
                } catch (err) {
                    errors++;
                    logger.error(`Error syncing product ${product.codigo_interno}:`, err);
                }
            }

            res.json({
                message: 'Sincronización completada',
                total: products.length,
                updated,
                errors
            });
        } catch (error) {
            logger.error('Error in sync-all:', error);
            return sendError(res, error, 'Error al sincronizar productos');
        }
    }
}

export const productBulkController = new ProductBulkController();
