import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { BlogPost } from "../../models/BlogPost";
import { sendError } from "../../middleware/errorHandler";

export class BlogPublicController {
  static async getPublishedPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const tag = req.query.tag as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;
      const whereClause: WhereOptions = {
        status: "published",
        // Todos los posts publicados se muestran (sin filtro de fecha/hora)
      };

      // Filtros
      if (category) {
        Object.assign(whereClause, {
          categories: {
            [Op.like]: `%${category}%`,
          },
        });
      }

      if (tag) {
        Object.assign(whereClause, {
          tags: {
            [Op.like]: `%${tag}%`,
          },
        });
      }

      if (search) {
        Object.assign(whereClause, {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { excerpt: { [Op.like]: `%${search}%` } },
            { content: { [Op.like]: `%${search}%` } },
            { tags: { [Op.like]: `%${search}%` } },
          ],
        });
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
      return sendError(res, error, "Error al obtener los posts del blog", 500, "INTERNAL_SERVER_ERROR");
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
      return sendError(res, error, "Error al obtener el post", 500, "INTERNAL_SERVER_ERROR");
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
      return sendError(res, error, "Error al procesar el like", 500, "INTERNAL_SERVER_ERROR");
    }
  }
}
