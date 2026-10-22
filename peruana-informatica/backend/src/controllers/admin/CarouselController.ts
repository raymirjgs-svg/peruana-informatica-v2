import { Request, Response } from 'express';
import { Carousel } from '../../models/Carousel';
import { sequelize } from '../../database/connection';
import { buildPaginationMeta, getSafetyLimit, resolvePagination } from '../../utils/pagination';
import { sendError } from '../../middleware/errorHandler';

export class CarouselController {
    /**
     * GET /api/admin/carousel
     * Obtiene todos los slides del carrusel (paginado)
     */
    static async getAll(req: Request, res: Response) {
        try {
            const { page, limit, offset, paginated } = resolvePagination(req.query);
            const order: [string, string][] = [['order', 'ASC'], ['id', 'ASC']];

            if (paginated) {
                const { rows, count } = await Carousel.findAndCountAll({
                    order,
                    limit,
                    offset
                });
                return res.json({
                    success: true,
                    data: rows,
                    pagination: buildPaginationMeta(page, limit, count)
                });
            }

            const slides = await Carousel.findAll({
                order,
                limit: getSafetyLimit(limit)
            });

            res.json(slides);
        } catch (error) {
            return sendError(res, error, 'Error al obtener slides del carrusel', 500, 'CAROUSEL_FETCH_ERROR');
        }
    }

    /**
     * GET /api/admin/carousel/active
     * Obtiene slides activos para el frontend público
     */
    static async getActive(req: Request, res: Response) {
        try {
            const slides = await Carousel.findAll({
                where: { isActive: true },
                order: [['order', 'ASC'], ['id', 'ASC']],
                attributes: ['id', 'title', 'description', 'buttonText', 'buttonUrl', 'backgroundColor', 'imageUrl']
            });

            res.json(slides);
        } catch (error) {
            return sendError(res, error, 'Error al obtener slides activos', 500, 'CAROUSEL_ACTIVE_ERROR');
        }
    }

    /**
     * GET /api/admin/carousel/:id
     * Obtiene un slide por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const slide = await Carousel.findByPk(req.params.id);

            if (!slide) {
                return res.status(404).json({
                    error: 'Slide no encontrado',
                    code: 'SLIDE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            res.json(slide);
        } catch (error) {
            return sendError(res, error, 'Error al obtener slide', 500, 'SLIDE_FETCH_ERROR');
        }
    }

    /**
     * POST /api/admin/carousel
     * Crea un nuevo slide
     */
    static async create(req: Request, res: Response) {
        try {
            const { title, description, buttonText, buttonUrl, backgroundColor, imageUrl, isActive = true, order = 0 } = req.body;

            const slide = await Carousel.create({
                title,
                description,
                buttonText,
                buttonUrl,
                backgroundColor: backgroundColor || 'from-blue-500 to-blue-700',
                imageUrl,
                isActive,
                order,
            });

            res.status(201).json(slide);
        } catch (error) {
            return sendError(res, error, 'Error al crear slide', 500, 'SLIDE_CREATE_ERROR');
        }
    }

    /**
     * PUT /api/admin/carousel/:id
     * Actualiza un slide
     */
    static async update(req: Request, res: Response) {
        try {
            const slide = await Carousel.findByPk(req.params.id);

            if (!slide) {
                return res.status(404).json({
                    error: 'Slide no encontrado',
                    code: 'SLIDE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            const allowedFields = ['title', 'description', 'buttonText', 'buttonUrl', 'backgroundColor', 'imageUrl', 'isActive', 'order'];
            const updates: any = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            await slide.update(updates);

            res.json(slide);
        } catch (error) {
            return sendError(res, error, 'Error al actualizar slide', 500, 'SLIDE_UPDATE_ERROR');
        }
    }

    /**
     * DELETE /api/admin/carousel/:id
     * Elimina un slide
     */
    static async delete(req: Request, res: Response) {
        try {
            const slide = await Carousel.findByPk(req.params.id);

            if (!slide) {
                return res.status(404).json({
                    error: 'Slide no encontrado',
                    code: 'SLIDE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            await slide.destroy();

            res.json({
                message: 'Slide eliminado correctamente',
                id: slide.id
            });
        } catch (error) {
            return sendError(res, error, 'Error al eliminar slide', 500, 'SLIDE_DELETE_ERROR');
        }
    }

    /**
     * PUT /api/admin/carousel/reorder
     * Actualiza el orden de los slides
     */
    static async reorder(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        try {
            const { slides } = req.body;

            // Actualizar el orden de cada slide
            for (const slideData of slides) {
                await Carousel.update(
                    { order: slideData.order },
                    { where: { id: slideData.id }, transaction }
                );
            }

            await transaction.commit();

            res.json({
                message: 'Orden actualizado correctamente',
                updatedSlides: slides.length
            });
        } catch (error) {
            await transaction.rollback();
            return sendError(res, error, 'Error al actualizar orden', 500, 'SLIDE_REORDER_ERROR');
        }
    }

    /**
     * POST /api/admin/carousel/upload
     * Sube imagen de carousel
     */
    static async uploadImage(req: Request, res: Response) {
        try {
            // req.file viene de multer middleware en la ruta
            const file = (req as any).file;
            
            if (!file) {
                return res.status(400).json({
                    error: 'No se subió ninguna imagen',
                    code: 'NO_IMAGE_UPLOADED'
                });
            }

            // Retornar la URL de la imagen
            const imageUrl = `/images/carousel/${file.filename}`;

            res.json({
                imageUrl,
                filename: file.filename,
                message: 'Imagen subida correctamente'
            });
        } catch (error: any) {
            if (error.message.includes('Solo se permiten imágenes')) {
                return res.status(400).json({
                    error: 'Error interno',
                    code: 'INVALID_FILE_TYPE'
                });
            }

            return sendError(res, error, 'Error al subir imagen', 500, 'IMAGE_UPLOAD_ERROR');
        }
    }
}