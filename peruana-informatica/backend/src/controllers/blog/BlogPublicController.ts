import { Request, Response } from "express";
import { Op } from "sequelize";
import { BlogPost } from "../../models/BlogPost";
import { logger } from "../../config/logger";

export class BlogPublicController {
  static async getPublishedPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const tag = req.query.tag as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;
      const whereClause: any = {
        status: "published",
        // Todos los posts publicados se muestran (sin filtro de fecha/hora)
      };

      // Filtros
      if (category) {
        whereClause.categories = {
          [Op.like]: `%${category}%`,
        };
      }

      if (tag) {
        whereClause.tags = {
          [Op.like]: `%${tag}%`,
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { excerpt: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { tags: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await BlogPost.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [
          ["is_featured", "DESC"],
          ["published_at", "DESC"],
        ],
        attributes: {
          exclude: ["ai_prompt"], // No exponer prompts en público
        },
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      logger.error("Error fetching published posts:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener los posts del blog",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener post por slug (frontend público)
  static async getPostBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const post = await BlogPost.findOne({
        where: {
          slug,
          status: "published",
          // Sin filtro de fecha - todos los posts publicados son visibles
        },
        attributes: {
          exclude: ["ai_prompt"], // No exponer prompts en público
        },
      });

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "El post solicitado no existe o no está publicado",
          code: "POST_NOT_FOUND",
        });
      }

      // Incrementar vistas
      await post.incrementViews();

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error("Error fetching post by slug:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener el post",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Incrementar likes de un post
  static async likePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post || post.status !== "published") {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "El post solicitado no existe o no está publicado",
          code: "POST_NOT_FOUND",
        });
      }

      await post.incrementLikes();

      res.json({
        success: true,
        message: "Like registrado exitosamente",
        data: { likes: post.likes + 1 },
      });
    } catch (error) {
      logger.error("Error liking post:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al procesar el like",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}
