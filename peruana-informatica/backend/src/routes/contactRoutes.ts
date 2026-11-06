import { Router } from "express";
import { ContactController } from "../controllers/contactController";
import { authenticateAdmin } from "../middleware/auth";
import { createRateLimit } from "../middleware/security";

const router = Router();

const contactRateLimit = createRateLimit(60 * 60 * 1000, 5, 'Demasiados mensajes enviados. Intenta de nuevo en 1 hora.');

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
router.post("/", contactRateLimit, ContactController.create);

// Rutas de administración (requieren autenticación)
/**
 * GET /api/contacts/admin
 * Obtener todos los contactos con filtros y paginación
 * Query params: page, limit, status, asunto, search, startDate, endDate
 */
router.get("/admin", authenticateAdmin, ContactController.getAll);

/**
 * GET /api/contacts/admin/stats
 * Obtener estadísticas de contactos
 */
router.get("/admin/stats", authenticateAdmin, ContactController.getStats);

/**
 * GET /api/contacts/admin/:id
 * Obtener un contacto específico por ID
 */
router.get("/admin/:id", authenticateAdmin, ContactController.getById);

/**
 * PUT /api/contacts/admin/:id/status
 * Actualizar el estado de un contacto
 * Body: { status: 'pending' | 'resolved' | 'spam' }
 */
router.put(
  "/admin/:id/status",
  authenticateAdmin,
  ContactController.updateStatus,
);

/**
 * DELETE /api/contacts/admin/:id
 * Eliminar un contacto
 */
router.delete("/admin/:id", authenticateAdmin, ContactController.delete);

/**
 * PUT /api/contacts/admin/bulk/resolve
 * Marcar múltiples contactos como resueltos
 * Body: { ids: number[] }
 */
router.put(
  "/admin/bulk/resolve",
  authenticateAdmin,
  ContactController.bulkResolve,
);

export { router as contactRoutes };
