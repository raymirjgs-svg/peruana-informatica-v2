import { Request, Response } from 'express';
import { PeruanaInformaticaService } from '../services/PeruanaInformaticaService';
import Product from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';

/**
 * Controlador para gestionar la sincronización con la API externa de Peruana Informática
 */
export class SyncController {
    /**
     * POST /api/sync/token
     * Solicita un nuevo token a la API externa
     */
    static async solicitarToken(req: Request, res: Response) {
        try {
            const { usuario = 'Raymir', dias = 30 } = req.body;

            const result = await PeruanaInformaticaService.solicitarToken(usuario, dias);

            if (result.success) {
                return res.json({
                    success: true,
                    message: 'Token obtenido y actualizado exitosamente',
                    token: result.token,
                    expiresAt: result.expiresAt
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message || 'No se pudo obtener el token'
                });
            }
        } catch (error: any) {
            console.error('Error en SyncController.solicitarToken:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al solicitar token',
                error: error.message
            });
        }
    }

    /**
     * Helper to find or create Brand, Category, and SubCategory
     */
    private static async resolveTaxonomy(marcaName: string | null, categoriaName: string | null) {
        let brand_id = null;
        let category_id = null;
        let sub_category_ids: number[] = [];

        // 1. Handle Brand
        if (marcaName) {
            const [brand] = await Brand.findOrCreate({
                where: { name: marcaName },
                defaults: {
                    name: marcaName,
                    slug: Brand.generateSlug(marcaName)
                }
            });
            brand_id = brand.id;
        }

        // 2. Handle Category and SubCategory
        if (categoriaName) {
            // Check for separators like " > " or " / "
            const parts = categoriaName.split(/\/|>/).map(s => s.trim()).filter(Boolean);

            if (parts.length > 0) {
                const mainCategoryName = parts[0];

                // Type guard: mainCategoryName is guaranteed to exist due to parts.length > 0
                if (!mainCategoryName) return { brand_id, category_id, sub_category_ids };

                // Find or Create Main Category
                const [category] = await Category.findOrCreate({
                    where: { name: mainCategoryName },
                    defaults: {
                        name: mainCategoryName,
                        slug: Category.generateSlug(mainCategoryName),
                        appears_in_menu: true
                    }
                });
                category_id = category.id;

                // Handle SubCategory (if exists e.g. "Laptops / Gaming")
                if (parts.length > 1) {
                    const subCategoryName = parts[1];

                    // Type guard: ensure subCategoryName is not undefined
                    if (!subCategoryName) return { brand_id, category_id, sub_category_ids };

                    const [subCategory] = await SubCategory.findOrCreate({
                        where: {
                            name: subCategoryName,
                            category_id: category.id
                        },
                        defaults: {
                            name: subCategoryName,
                            slug: SubCategory.generateSlug(subCategoryName),
                            category_id: category.id,
                            description: `Subcategoría ${subCategoryName}`,
                            is_active: true
                        }
                    });
                    sub_category_ids.push(subCategory.id);
                }
            }
        }

        return { brand_id, category_id, sub_category_ids };
    }

    /**
     * POST /api/sync/product/:id
     * Sincroniza un producto específico con la API externa
     */
    static async sincronizarProducto(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de producto requerido'
                });
            }

            const datos = await PeruanaInformaticaService.obtenerStockYPrecio(id);

            if (!datos) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo obtener información del producto'
                });
            }

            // Buscar el producto en la base de datos local usando codigo_interno
            const producto = await Product.findOne({
                where: { codigo_interno: id } as any
            });

            if (producto) {
                // Resolver Taxonomía (Marca y Categoría)
                const { brand_id, category_id, sub_category_ids } = await SyncController.resolveTaxonomy(
                    datos.marca || null,
                    datos.categoria || null
                );

                // Actualizar producto con nuevos datos y relaciones
                await producto.update({
                    stock: datos.stock,
                    price: datos.pre_cli,        // Precio Cliente (principal)
                    price_cot: datos.pre_cot,    // Precio Cotización
                    price_web: datos.pre_web,    // Precio Web
                    price_dis: datos.pre_dis,    // Precio Distribuidor
                    brand_id: brand_id ?? producto.brand_id,
                    category_id: category_id ?? producto.category_id,
                    category: datos.categoria || producto.category // String legacy support
                } as any);

                // Actualizar Subcategorías si existen
                if (sub_category_ids.length > 0) {
                    // @ts-ignore - setSubCategories es un método mágico de Sequelize
                    if (producto.setSubCategories) {
                        // @ts-ignore
                        await producto.setSubCategories(sub_category_ids);
                    }
                }

                return res.json({
                    success: true,
                    message: 'Producto sincronizado exitosamente con taxonomía',
                    data: {
                        id: producto.cod_producto,
                        externalId: id,
                        nombre: producto.name,
                        stock: datos.stock,
                        pre_cli: datos.pre_cli,
                        brand: datos.marca,
                        category: datos.categoria
                    }
                });
            } else {
                return res.json({
                    success: true,
                    message: 'Datos obtenidos (producto no existe en BD local)',
                    data: datos,
                    warning: 'El producto no existe en la base de datos local'
                });
            }
        } catch (error: any) {
            console.error('Error en SyncController.sincronizarProducto:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al sincronizar producto',
                error: error.message
            });
        }
    }

    /**
     * POST /api/sync/products
     * Sincroniza múltiples productos con la API externa
     */
    static async sincronizarProductos(req: Request, res: Response) {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de IDs de productos'
                });
            }

            const resultados = await PeruanaInformaticaService.sincronizarProductos(ids);

            // Actualizar productos en la base de datos local
            const actualizados = [];
            const errores = [];

            for (const resultado of resultados) {
                if (resultado.success && 'datos' in resultado && resultado.datos) {
                    try {
                        const producto = await Product.findOne({
                            where: { codigo_interno: resultado.id } as any
                        });

                        if (producto) {
                            // Resolver Taxonomía
                            const { brand_id, category_id, sub_category_ids } = await SyncController.resolveTaxonomy(
                                resultado.datos.marca,
                                resultado.datos.categoria
                            );

                            await producto.update({
                                stock: resultado.datos.stock,
                                price: resultado.datos.pre_cli,
                                price_cot: resultado.datos.pre_cot,
                                price_web: resultado.datos.pre_web,
                                price_dis: resultado.datos.pre_dis,
                                brand_id: brand_id ?? producto.brand_id,
                                category_id: category_id ?? producto.category_id,
                                category: resultado.datos.categoria || producto.category
                            } as any);

                            // Sync SubCategories
                            if (sub_category_ids.length > 0) {
                                // @ts-ignore
                                if (producto.setSubCategories) {
                                    // @ts-ignore
                                    await producto.setSubCategories(sub_category_ids);
                                }
                            }

                            actualizados.push({
                                id: producto.cod_producto,
                                externalId: resultado.id,
                                nombre: producto.name,
                                actualizado: true
                            });
                        }
                    } catch (error: any) {
                        errores.push({
                            id: resultado.id,
                            error: error.message
                        });
                    }
                } else if (!resultado.success && 'error' in resultado) {
                    errores.push({
                        id: resultado.id,
                        error: resultado.error
                    });
                }
            }

            return res.json({
                success: true,
                message: `Sincronización completada: ${actualizados.length} productos actualizados`,
                data: {
                    total: ids.length,
                    actualizados: actualizados.length,
                    errores: errores.length,
                    detalles: {
                        actualizados,
                        errores
                    }
                }
            });
        } catch (error: any) {
            console.error('Error en SyncController.sincronizarProductos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al sincronizar productos',
                error: error.message
            });
        }
    }

    /**
     * POST /api/sync/all-products
     * Sincroniza todos los productos que tienen codigo_interno con la API externa
     */
    static async sincronizarTodosLosProductos(req: Request, res: Response) {
        try {
            const { Op } = require('sequelize');

            // Obtener todos los productos que tienen codigo_interno
            const productos = await Product.findAll({
                where: {
                    codigo_interno: {
                        [Op.ne]: null,
                        [Op.ne]: ''
                    }
                } as any,
                attributes: ['cod_producto', 'codigo_interno', 'name']
            });

            if (productos.length === 0) {
                return res.json({
                    success: true,
                    message: 'No hay productos con codigo_interno para sincronizar',
                    data: {
                        total: 0,
                        actualizados: 0
                    }
                });
            }

            const externalIds = productos.map(p => p.codigo_interno!).filter(Boolean);

            const resultados = await PeruanaInformaticaService.sincronizarProductos(externalIds);

            // Actualizar productos en la base de datos
            const actualizados = [];
            const errores = [];

            for (const resultado of resultados) {
                if (resultado.success && 'datos' in resultado && resultado.datos) {
                    try {
                        const producto = await Product.findOne({
                            where: { codigo_interno: resultado.id } as any
                        });

                        if (producto) {
                            // Resolver Taxonomía
                            const { brand_id, category_id, sub_category_ids } = await SyncController.resolveTaxonomy(
                                resultado.datos.marca,
                                resultado.datos.categoria
                            );

                            await producto.update({
                                stock: resultado.datos.stock,
                                price: resultado.datos.pre_cli,
                                price_cot: resultado.datos.pre_cot,
                                price_web: resultado.datos.pre_web,
                                price_dis: resultado.datos.pre_dis,
                                brand_id: brand_id ?? producto.brand_id,
                                category_id: category_id ?? producto.category_id,
                                category: resultado.datos.categoria || producto.category
                            } as any);

                            // Sync SubCategories
                            if (sub_category_ids.length > 0) {
                                // @ts-ignore
                                if (producto.setSubCategories) {
                                    // @ts-ignore
                                    await producto.setSubCategories(sub_category_ids);
                                }
                            }

                            actualizados.push({
                                id: producto.cod_producto,
                                externalId: resultado.id,
                                nombre: producto.name
                            });
                        }
                    } catch (error: any) {
                        errores.push({
                            id: resultado.id,
                            error: error.message
                        });
                    }
                } else if (!resultado.success && 'error' in resultado) {
                    errores.push({
                        id: resultado.id,
                        error: resultado.error
                    });
                }
            }

            return res.json({
                success: true,
                message: `Sincronización masiva completada: ${actualizados.length}/${productos.length} productos actualizados`,
                data: {
                    total: productos.length,
                    actualizados: actualizados.length,
                    errores: errores.length,
                    detalles: {
                        actualizados,
                        errores
                    }
                }
            });
        } catch (error: any) {
            console.error('Error en SyncController.sincronizarTodosLosProductos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al sincronizar todos los productos',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sync/verify-token
     * Verifica el estado del token actual
     */
    static async verificarToken(req: Request, res: Response) {
        try {
            const tokenValido = await PeruanaInformaticaService.verificarYRenovarToken();

            return res.json({
                success: true,
                tokenValido,
                message: tokenValido ? 'Token válido' : 'Token inválido o expirado'
            });
        } catch (error: any) {
            console.error('Error en SyncController.verificarToken:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar token',
                error: error.message
            });
        }
    }
}

