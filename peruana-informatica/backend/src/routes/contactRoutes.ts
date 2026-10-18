import { Router } from "express";
import { ContactController } from "../controllers/contactController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Test endpoint to verify server connectivity
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Contact routes working!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/contacts/test",
  });
});

// Rutas públicas (sin autenticación)
/**
 * POST /api/contacts
 * Crear un nuevo contacto desde el formulario público
 */
router.post("/", ContactController.create);

// Rutas de administración (requieren autenticación)
/**
 * GET /api/contacts/admin
 * Obtener todos los contactos con filtros y paginación
 * Query params: page, limit, status, asunto, search, startDate, endDate
 */
router.get("/admin", authenticateToken, requireAdmin, ContactController.getAll);

/**
 * GET /api/contacts/admin/stats
 * Obtener estadísticas de contactos
 */
router.get("/admin/stats", authenticateToken, requireAdmin, ContactController.getStats);

/**
 * GET /api/contacts/admin/:id
 * Obtener un contacto específico por ID
 */
router.get("/admin/:id", authenticateToken, requireAdmin, ContactController.getById);

/**
 * PUT /api/contacts/admin/:id/status
 * Actualizar el estado de un contacto
 * Body: { status: 'pending' | 'resolved' | 'spam' }
 */
router.put(
  "/admin/:id/status",
  authenticateToken, requireAdmin,
  ContactController.updateStatus,
);

/**
 * DELETE /api/contacts/admin/:id
 * Eliminar un contacto
 */
router.delete("/admin/:id", authenticateToken, requireAdmin, ContactController.delete);

/**
 * PUT /api/contacts/admin/bulk/resolve
 * Marcar múltiples contactos como resueltos
 * Body: { ids: number[] }
 */
router.put(
  "/admin/bulk/resolve",
  authenticateToken, requireAdmin,
  ContactController.bulkResolve,
);

export { router as contactRoutes };
