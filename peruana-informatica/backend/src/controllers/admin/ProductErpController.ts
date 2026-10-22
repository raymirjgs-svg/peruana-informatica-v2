import { Request, Response } from 'express';
import { Product } from '../../models/Product';
import { Brand } from '../../models/Brand';
import { Category } from '../../models/Category';
import { Image } from '../../models/Image';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';
import { logger } from '../../config/logger';
import { sendError } from '../../middleware/errorHandler';

export class ProductErpController {
    async erpLookup(req: Request, res: Response) {
        try {
            const { code } = req.params;

            // 1. Buscar en BD local primero
            const existingProduct = await Product.findOne({
                where: { codigo_interno: code },
                include: [
                    { model: Brand, as: 'productBrand', attributes: ['id', 'name'] },
                    { model: Category, as: 'productCategory', attributes: ['id', 'name'] },
                    { model: Image, as: 'images', attributes: ['cod_galeria', 'imagen'] }
                ]
            });

            if (existingProduct) {
                return res.json({
                    found: true,
                    source: 'db',
                    message: 'El producto ya existe en la base de datos',
                    product: {
                        ...existingProduct.toJSON(),
                        id: existingProduct.cod_producto
                    }
                });
            }

            // 2. Buscar en API del sistema de ventas (ERP real)
            try {
                logger.info(`Buscando producto ${code} en API de ventas...`);
                const erpResult = await PeruanaInformaticaService.consultarArticulo(String(code));
                logger.info('Respuesta API:', JSON.stringify(erpResult, null, 2));

                let articulo = null;

                if (erpResult) {
                    if (erpResult.success && erpResult.data) {
                        articulo = erpResult.data;
                    } else if (!erpResult.success && erpResult.message) {
                        return res.json({
                            found: false,
                            message: erpResult.message || 'Error al consultar el sistema de ventas'
                        });
                    }
                }

                if (articulo) {
                    return res.json({
                        found: true,
                        source: 'erp',
                        message: 'Producto encontrado en sistema de ventas',
                        product: {
                            codigo: articulo.cod_articulo || articulo.id || code,
                            nombre: articulo.nombre || articulo.descripcion || 'Sin nombre',
                            precio: parseFloat(articulo.pre_web) || parseFloat(articulo.pre_cli) || parseFloat(articulo.pre_cot) || 0,
                            stock: parseInt(articulo.stock) || 0,
                            marca: articulo.marca || null,
                            categoria: articulo.categoria || null,
                            pre_cot: parseFloat(articulo.pre_cot) || 0,
                            pre_cli: parseFloat(articulo.pre_cli) || 0,
                            pre_web: parseFloat(articulo.pre_web) || 0,
                            pre_dis: parseFloat(articulo.pre_dis) || 0
                        }
                    });
                } else {
                    return res.json({
                        found: false,
                        message: 'Producto no encontrado en el sistema de ventas'
                    });
                }
            } catch (apiError: any) {
                logger.error('Error consultando API de ventas:', apiError.message);

                if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized') || apiError.message?.includes('autorizado')) {
                    return res.json({
                        found: false,
                        message: 'Token de API expirado. Contacte al administrador para renovar el token.'
                    });
                }

                return res.json({
                    found: false,
                    message: 'Error al consultar sistema de ventas: ' + (apiError.message || 'Error desconocido')
                });
            }

        } catch (error) {
            logger.error('Error in ERP lookup:', error);
            return sendError(res, error, 'Error interno del servidor');
        }
    }
}

export const productErpController = new ProductErpController();
