import { Request, Response } from "express";
import { Op, ValidationError } from "sequelize";
import type { WhereOptions } from "sequelize";
import { BlogPost } from "../../models/BlogPost";
import type { BlogPostAttributes, BlogPostCreationAttributes } from "../../models/BlogPost";
import { BlogTitleSuggestion } from "../../models/BlogTitleSuggestion";
import { geminiService } from "../../services/GeminiService";
import { logger } from "../../config/logger";
import { sendError } from "../../middleware/errorHandler";

export class BlogAdminController {
  static async getAllPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;
      const whereClause: WhereOptions<BlogPostAttributes> = {
        ...(status ? { status: status as BlogPostAttributes["status"] } : {}),
        ...(search
          ? {
              [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { excerpt: { [Op.like]: `%${search}%` } },
                { author_name: { [Op.like]: `%${search}%` } },
              ],
            }
          : {}),
      };

      const { count, rows } = await BlogPost.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
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
      logger.error("Error fetching all posts:", error);
      return sendError(res, error, "Error al obtener los posts", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  static async createPost(req: Request, res: Response) {
    try {
      logger.info("📝 Creating new blog post");
      logger.info("Request body:", req.body);

      const {
        title,
        slug,
        excerpt,
        content,
        featured_image,
        meta_title,
        meta_description,
        meta_keywords,
        author_name,
        author_email,
        status,
        scheduled_at,
        is_featured,
        tags,
        categories,
        ai_generated,
        ai_prompt,
        ai_model,
      } = req.body;

      // Validar datos requeridos
      if (!title || !content) {
        return res.status(400).json({
          error: "Datos incompletos",
          message: "Título y contenido son requeridos",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      // Generar imagen automáticamente si no se proporciona y Gemini está disponible
      let generatedImage = featured_image;
      if (!featured_image && geminiService.isReady()) {
        try {
          logger.info("🖼️ Auto-generating image for post:", title);
          generatedImage = await geminiService.generateBlogImage(title, content);
          logger.info("✅ Image generated:", generatedImage);
        } catch {
          logger.error("❌ Failed to generate image, using fallback");
          generatedImage = `https://source.unsplash.com/1200x600/?technology`;
        }
      }

      const newPost = await BlogPost.create({
        title,
        slug: slug || BlogPost.generateSlug(title),
        excerpt,
        content,
        featured_image: generatedImage,
        meta_title,
        meta_description,
        meta_keywords,
        author_name: author_name || "Peruana Informática",
        author_email,
        status: status || "draft",
        scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
        is_featured: is_featured || false,
        tags,
        categories,
        ai_generated: ai_generated || false,
        ai_prompt,
        ai_model,
      });

      logger.info("✅ Blog post created with ID:", newPost.id);

      res.status(201).json({
        success: true,
        message: "Post creado exitosamente",
        data: newPost,
      });
    } catch (error) {
      logger.error("❌ Error creating blog post:", error);

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        const validationErrors = (error as ValidationError).errors.map(err => ({
          field: err.path,
          message: 'Error interno',
        }));

        return res.status(400).json({
          error: "Datos inválidos",
          message: "Por favor verifica los datos enviados",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        });
      }

      if (error instanceof Error && error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Slug duplicado",
          message: "Ya existe un post con este slug",
          code: "DUPLICATE_SLUG",
        });
      }

      return sendError(res, error, "Error al crear el post", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  static async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error("Error fetching post by ID:", error);
      return sendError(res, error, "Error al obtener el post", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.info(`📝 Updating blog post ID: ${id}`);

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      const allowedFields = [
        "title",
        "slug",
        "excerpt",
        "content",
        "featured_image",
        "meta_title",
        "meta_description",
        "meta_keywords",
        "author_name",
        "author_email",
        "status",
        "scheduled_at",
        "is_featured",
        "tags",
        "categories",
        "ai_generated",
        "ai_prompt",
        "ai_model",
      ];
      const updates: Record<string, unknown> = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      if (updates.scheduled_at) {
        updates.scheduled_at = new Date(updates.scheduled_at as string | number | Date);
      }

      await post.update(updates as Partial<BlogPostCreationAttributes>);

      logger.info("✅ Blog post updated successfully");

      res.json({
        success: true,
        message: "Post actualizado exitosamente",
        data: post,
      });
    } catch (error) {
      logger.error("❌ Error updating blog post:", error);

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        const validationErrors = (error as ValidationError).errors.map(err => ({
          field: err.path,
          message: 'Error interno',
        }));

        return res.status(400).json({
          error: "Datos inválidos",
          message: "Por favor verifica los datos enviados",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        });
      }

      return sendError(res, error, "Error al actualizar el post", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await BlogPost.findByPk(id);

      if (!post) {
        return res.status(404).json({
          error: "Post no encontrado",
          message: "No se encontró el post solicitado",
          code: "POST_NOT_FOUND",
        });
      }

      await post.destroy();

      res.json({
        success: true,
        message: "Post eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Error deleting blog post:", error);
      return sendError(res, error, "Error al eliminar el post", 500, "INTERNAL_SERVER_ERROR");
    }
  }

  static async getBlogStats(req: Request, res: Response) {
    try {
      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        aiGeneratedPosts,
        totalViews,
        totalLikes,
        pendingSuggestions,
      ] = await Promise.all([
        BlogPost.count(),
        BlogPost.count({ where: { status: "published" } }),
        BlogPost.count({ where: { status: "draft" } }),
        BlogPost.count({ where: { ai_generated: true } }),
        BlogPost.sum("views"),
        BlogPost.sum("likes"),
        BlogTitleSuggestion.count({ where: { status: "pending" } }),
      ]);

      // Posts más populares
      const popularPosts = await BlogPost.findAll({
        where: { status: "published" },
        order: [["views", "DESC"]],
        limit: 5,
        attributes: ["id", "title", "slug", "views", "likes", "published_at"],
      });

      // Posts recientes
      const recentPosts = await BlogPost.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: [
          "id",
          "title",
          "slug",
          "status",
          "ai_generated",
          "createdAt",
        ],
      });

      res.json({
        success: true,
        data: {
          totals: {
            posts: totalPosts,
            published: publishedPosts,
            drafts: draftPosts,
            ai_generated: aiGeneratedPosts,
            views: totalViews || 0,
            likes: totalLikes || 0,
            pending_suggestions: pendingSuggestions,
          },
          popular_posts: popularPosts,
          recent_posts: recentPosts,
          ai_configured: geminiService.isReady(),
        },
      });
    } catch (error) {
      logger.error("Error fetching blog stats:", error);
      return sendError(res, error, "Error al obtener estadísticas", 500, "INTERNAL_SERVER_ERROR");
    }
  }
}
