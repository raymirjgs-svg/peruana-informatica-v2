import { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost";
import { getBlogDemoPosts } from "../../data/blogDemoPosts";
import { logger } from "../../config/logger";
import { sendError } from "../../middleware/errorHandler";

export class BlogDemoController {
  static async loadDemoData(req: Request, res: Response) {
    try {
      logger.info("📦 Loading demo blog posts...");

      const demoPosts = getBlogDemoPosts();

      // Crear posts con cálculo de word_count y reading_time
      const createdPosts = await Promise.all(
        demoPosts.map(async (postData) => {
          const wordCount = postData.content.split(/\s+/).length;
          const readingTime = Math.ceil(wordCount / 200);

          return await BlogPost.create({
            ...postData,
            word_count: wordCount,
            reading_time: readingTime,
            ai_generated: false,
          });
        }),
      );

      logger.info(`✅ Created ${createdPosts.length} demo blog posts`);

      res.status(201).json({
        success: true,
        message: `${createdPosts.length} posts de demostración creados exitosamente`,
        data: {
          posts: createdPosts,
          count: createdPosts.length,
        },
      });
    } catch (error: any) {
      logger.error("❌ Error loading demo data:", error);
      return sendError(res, error, "Error al crear posts de demostración", 500, "DEMO_DATA_ERROR");
    }
  }
}
