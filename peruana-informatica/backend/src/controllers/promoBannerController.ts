import { Request, Response } from 'express';
import { PromoBanner } from '../models/PromoBanner';

export class PromoBannerController {
    /**
     * Get active banners (Public endpoint)
     */
    async getActiveBanners(req: Request, res: Response) {
        try {
            const banners = await PromoBanner.findAll({
                where: { is_active: true },
                order: [['priority', 'DESC'], ['created_at', 'DESC']],
                attributes: [
                    'id',
                    'title',
                    'description',
                    'image_url',
                    'coupon_code',
                    'show_as_popup',
                    'popup_delay'
                ]
            });

            return res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Error fetching banners:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener banners'
            });
        }
    }

    // =================== ADMIN ENDPOINTS ===================

    /**
     * Get all banners (Admin)
     */
    async getAllBanners(req: Request, res: Response) {
        try {
            const banners = await PromoBanner.findAll({
                order: [['priority', 'DESC'], ['created_at', 'DESC']]
            });

            return res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Error fetching all banners:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener banners'
            });
        }
    }

    /**
     * Create banner (Admin)
     */
    async createBanner(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                image_url,
                coupon_code,
                show_as_popup,
                popup_delay,
                priority
            } = req.body;

            if (!title || !image_url) {
                return res.status(400).json({
                    success: false,
                    message: 'title y image_url son requeridos'
                });
            }

            const banner = await PromoBanner.create({
                title,
                description,
                image_url,
                coupon_code: coupon_code?.toUpperCase(),
                show_as_popup: show_as_popup || false,
                popup_delay: popup_delay || 3,
                priority: priority || 0,
                is_active: true
            });

            return res.status(201).json({
                success: true,
                message: 'Banner creado exitosamente',
                data: banner
            });
        } catch (error) {
            console.error('Error creating banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear banner'
            });
        }
    }

    /**
     * Update banner (Admin)
     */
    async updateBanner(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const banner = await PromoBanner.findByPk(id);

            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner no encontrado'
                });
            }

            if (updateData.coupon_code) {
                updateData.coupon_code = updateData.coupon_code.toUpperCase();
            }

            await banner.update(updateData);

            return res.status(200).json({
                success: true,
                message: 'Banner actualizado exitosamente',
                data: banner
            });
        } catch (error) {
            console.error('Error updating banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar banner'
            });
        }
    }

    /**
     * Delete banner (Admin)
     */
    async deleteBanner(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const banner = await PromoBanner.findByPk(id);

            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner no encontrado'
                });
            }

            await banner.destroy();

            return res.status(200).json({
                success: true,
                message: 'Banner eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error deleting banner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar banner'
            });
        }
    }

    /**
     * Toggle banner active status (Admin)
     */
    async toggleBannerStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const banner = await PromoBanner.findByPk(id);

            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner no encontrado'
                });
            }

            await banner.update({
                is_active: !banner.is_active
            });

            return res.status(200).json({
                success: true,
                message: `Banner ${banner.is_active ? 'activado' : 'desactivado'}`,
                data: banner
            });
        } catch (error) {
            console.error('Error toggling banner status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del banner'
            });
        }
    }
}

export const promoBannerController = new PromoBannerController();
