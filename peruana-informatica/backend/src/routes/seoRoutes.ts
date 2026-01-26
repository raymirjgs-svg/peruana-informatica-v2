import { Router } from "express";
import { SeoController } from "../controllers/seoController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Test endpoint to verify server connectivity
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "SEO routes working!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/seo/test",
  });
});

// Todas las rutas requieren autenticación de administrador

/**
 * GET /api/seo
 * Obtener todas las configuraciones SEO
 * Query params: page_type, is_active
 */
router.get("/", authenticateAdmin, SeoController.getAll);

/**
 * GET /api/seo/analysis
 * Obtener análisis SEO completo del sitio
 */
router.get("/analysis", authenticateAdmin, SeoController.getSeoAnalysis);

/**
 * GET /api/seo/page/:page_type
 * Obtener configuración SEO por tipo de página
 * Query params: page_identifier (opcional)
 */
router.get("/page/:page_type", authenticateAdmin, SeoController.getByPageType);

/**
 * PUT /api/seo/page/:page_type
 * Actualizar configuración SEO por tipo de página
 * Query params: page_identifier (opcional)
 * Body: configuración SEO a actualizar
 */
router.put("/page/:page_type", authenticateAdmin, SeoController.updateByPageType);

/**
 * POST /api/seo
 * Crear nueva configuración SEO
 * Body: configuración SEO completa
 */
router.post("/", authenticateAdmin, SeoController.create);

/**
 * GET /api/seo/:id
 * Obtener configuración SEO por ID
 */
router.get("/:id", authenticateAdmin, SeoController.getById);

/**
 * PUT /api/seo/:id
 * Actualizar configuración SEO por ID
 * Body: configuración SEO a actualizar
 */
router.put("/:id", authenticateAdmin, SeoController.update);

/**
 * DELETE /api/seo/:id
 * Eliminar configuración SEO
 */
router.delete("/:id", authenticateAdmin, SeoController.delete);

export { router as seoRoutes };
