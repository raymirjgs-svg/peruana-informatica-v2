import { Router } from "express";
import { BlogController } from "../controllers/blogController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Manejar solicitudes OPTIONS para CORS preflight - PUBLIC ROUTES
router.options("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/post/:slug", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/post/:id/like", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ====================== PUBLIC ROUTES ======================

/**
 * GET /api/blog
 * Obtener posts publicados para el frontend público
 * Query params: page, limit, category, tag, search
 */
router.get("/", BlogController.getPublishedPosts);

/**
 * GET /api/blog/post/:slug
 * Obtener post específico por slug (frontend público)
 */
router.get("/post/:slug", BlogController.getPostBySlug);

/**
 * POST /api/blog/post/:id/like
 * Dar like a un post
 */
router.post("/post/:id/like", BlogController.likePost);

// ====================== ADMIN ROUTES ======================

/**
 * GET /api/blog/admin
 * Obtener todos los posts para administración
 * Query params: page, limit, status, search
 */
router.get("/admin", authenticateAdmin, BlogController.getAllPosts);

/**
 * GET /api/blog/admin/stats
 * Obtener estadísticas del blog
 */
router.get("/admin/stats", authenticateAdmin, BlogController.getBlogStats);

/**
 * POST /api/blog/admin
 * Crear nuevo post
 * Body: post data
 */
router.post("/admin", authenticateAdmin, BlogController.createPost);

/**
 * GET /api/blog/admin/:id
 * Obtener post específico por ID
 */
router.get("/admin/:id", authenticateAdmin, BlogController.getPostById);

/**
 * PUT /api/blog/admin/:id
 * Actualizar post existente
 * Body: post data to update
 */
router.put("/admin/:id", authenticateAdmin, BlogController.updatePost);

/**
 * DELETE /api/blog/admin/:id
 * Eliminar post
 */
router.delete("/admin/:id", authenticateAdmin, BlogController.deletePost);

// ====================== AI FEATURES ======================

/**
 * POST /api/blog/admin/ai/generate-titles
 * Generar títulos con IA
 * Body: { topic?, count?, model? }
 */
router.post(
  "/admin/ai/generate-titles",
  authenticateAdmin,
  BlogController.generateTitles,
);

/**
 * GET /api/blog/admin/ai/title-suggestions
 * Obtener sugerencias de títulos generadas
 * Query params: status?, topic?
 */
router.get(
  "/admin/ai/title-suggestions",
  authenticateAdmin,
  BlogController.getTitleSuggestions,
);

/**
 * POST /api/blog/admin/ai/generate-content
 * Generar contenido completo desde un título sugerido
 * Body: { title_suggestion_id, model? }
 */
router.post(
  "/admin/ai/generate-content",
  authenticateAdmin,
  BlogController.generateContentFromTitle,
);

/**
 * PUT /api/blog/admin/ai/title-suggestions/:id
 * Gestionar sugerencia de título (seleccionar/rechazar)
 * Body: { action: 'select' | 'reject' }
 */
router.put(
  "/admin/ai/title-suggestions/:id",
  authenticateAdmin,
  BlogController.manageTitleSuggestion,
);

// Manejar solicitudes OPTIONS para CORS preflight
router.options("/admin/ai/title-suggestions/:id", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Manejar solicitudes OPTIONS generales para todas las rutas de AI
router.options("/admin/ai/title-suggestions", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/admin/ai/generate-titles", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/admin/ai/generate-content", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ====================== CONFIGURATION & DEMO ======================

/**
 * POST /api/blog/admin/config/gemini
 * Configurar API Key de Google Gemini (GRATIS)
 * Body: { apiKey: string }
 */
router.post(
  "/admin/config/gemini",
  authenticateAdmin,
  BlogController.configureGemini,
);

/**
 * POST /api/blog/admin/demo
 * Cargar posts de demostración
 */
router.post("/admin/demo", authenticateAdmin, BlogController.loadDemoData);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Blog routes working!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/blog/test",
  });
});

export { router as blogRoutes };