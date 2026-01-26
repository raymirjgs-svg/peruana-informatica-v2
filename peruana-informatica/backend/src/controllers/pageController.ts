import { Request, Response } from 'express';
import { Page } from '../models/Page';
import { Op } from 'sequelize';

export class PageController {

    // Admin: Get all pages
    async getAllPages(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;
            const search = req.query.search as string;

            const whereClause: any = {};
            if (search) {
                whereClause.title = { [Op.like]: `%${search}%` };
            }

            const { count, rows } = await Page.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['created_at', 'DESC']],
            });

            return res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching pages:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Public: Get page by slug
    async getPageBySlug(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const page = await Page.findOne({
                where: { slug, is_published: true },
                attributes: ['title', 'content', 'meta_title', 'meta_description', 'updated_at']
            });

            if (!page) {
                return res.status(404).json({ error: 'Página no encontrada' });
            }

            return res.json({ success: true, data: page });
        } catch (error) {
            console.error('Error fetching page by slug:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Admin: Get page by ID
    async getPageById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const page = await Page.findByPk(id);

            if (!page) {
                return res.status(404).json({ error: 'Página no encontrada' });
            }

            return res.json({ success: true, data: page });
        } catch (error) {
            console.error('Error getting page:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Admin: Create page
    async createPage(req: Request, res: Response) {
        try {
            const { title, slug, content, is_published, meta_title, meta_description } = req.body;

            // Check for duplicate slug
            const existingPage = await Page.findOne({ where: { slug } });
            if (existingPage) {
                return res.status(400).json({ error: 'Ya existe una página con este enlace (slug)' });
            }

            const newPage = await Page.create({
                title,
                slug,
                content,
                is_published,
                meta_title,
                meta_description,
            });

            return res.status(201).json({ success: true, data: newPage });
        } catch (error) {
            console.error('Error creating page:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Admin: Update page
    async updatePage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, slug, content, is_published, meta_title, meta_description } = req.body;

            const page = await Page.findByPk(id);
            if (!page) {
                return res.status(404).json({ error: 'Página no encontrada' });
            }

            // Check slug uniqueness if changed
            if (slug && slug !== page.slug) {
                const existingPage = await Page.findOne({ where: { slug } });
                if (existingPage) {
                    return res.status(400).json({ error: 'Ya existe una página con este enlace' });
                }
            }

            await page.update({
                title,
                slug,
                content,
                is_published,
                meta_title,
                meta_description,
            });

            return res.json({ success: true, data: page });
        } catch (error) {
            console.error('Error updating page:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Admin: Delete page
    async deletePage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const page = await Page.findByPk(id);

            if (!page) {
                return res.status(404).json({ error: 'Página no encontrada' });
            }

            await page.destroy();
            return res.json({ success: true, message: 'Página eliminada correctamente' });
        } catch (error) {
            console.error('Error deleting page:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}

export const pageController = new PageController();
