import { Request, Response } from "express";
import { Contact } from "../models/Contact";
import { Op } from "sequelize";

export class ContactController {
  // Crear un nuevo contacto (formulario público)
  static async create(req: Request, res: Response) {
    try {
      console.log("📧 Contact creation request received");
      console.log("Request body:", req.body);
      console.log("Request headers:", req.headers);

      const { nombre, email, telefono, asunto, mensaje } = req.body;

      // Validar datos requeridos
      console.log("Validating required fields...");
      console.log(
        "nombre:",
        nombre,
        "email:",
        email,
        "asunto:",
        asunto,
        "mensaje:",
        mensaje,
      );

      if (!nombre || !email || !asunto || !mensaje) {
        console.log("❌ Missing required fields");
        return res.status(400).json({
          error: "Datos incompletos",
          message: "Nombre, email, asunto y mensaje son requeridos",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      // Obtener información adicional de la request
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get("User-Agent");
      console.log("Client info - IP:", ip_address, "User-Agent:", user_agent);

      // Verificar si ya existe un contacto reciente con el mismo email (prevenir spam)
      console.log("Checking for recent contacts...");
      const recentContact = await Contact.findOne({
        where: {
          email: email.toLowerCase().trim(),
          createdAt: {
            [Op.gte]: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos
          },
        },
      });
      console.log("Recent contact found:", !!recentContact);

      if (recentContact) {
        console.log("❌ Too many requests from same email");
        return res.status(429).json({
          error: "Demasiados intentos",
          message:
            "Ya has enviado un mensaje recientemente. Por favor espera unos minutos antes de enviar otro.",
          code: "TOO_MANY_REQUESTS",
        });
      }

      // Crear el contacto
      console.log("Creating new contact...");
      const newContact = await Contact.create({
        nombre,
        email,
        telefono,
        asunto,
        mensaje,
        ip_address,
        user_agent,
      });
      console.log("✅ Contact created with ID:", newContact.id);

      // Respuesta exitosa
      console.log("✅ Contact creation successful");
      res.status(201).json({
        success: true,
        message: "Mensaje enviado exitosamente. Te contactaremos pronto.",
        data: {
          id: newContact.id,
          nombre: newContact.nombre,
          email: newContact.email,
          asunto: newContact.asunto,
          createdAt: newContact.createdAt,
        },
      });
    } catch (error: any) {
      console.error("❌ Error creating contact:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // Manejar errores de validación de Sequelize
      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          error: "Datos inválidos",
          message: "Por favor verifica los datos enviados",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        });
      }

      res.status(500).json({
        error: "Error interno del servidor",
        message:
          "Ocurrió un error al procesar tu mensaje. Por favor inténtalo de nuevo.",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener todos los contactos con filtros (admin)
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const asunto = req.query.asunto as string;
      const search = req.query.search as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // Filtros
      if (status && ["pending", "resolved", "spam"].includes(status)) {
        whereClause.status = status;
      }

      if (asunto) {
        whereClause.asunto = asunto;
      }

      if (search) {
        whereClause[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { mensaje: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else if (startDate) {
        whereClause.createdAt = {
          [Op.gte]: new Date(startDate),
        };
      } else if (endDate) {
        whereClause.createdAt = {
          [Op.lte]: new Date(endDate),
        };
      }

      const { count, rows } = await Contact.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        attributes: {
          exclude: ["ip_address", "user_agent"], // No exponer datos sensibles
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
      console.error("Error fetching contacts:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener los contactos",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener un contacto por ID (admin)
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const contact = await Contact.findByPk(id);

      if (!contact) {
        return res.status(404).json({
          error: "Contacto no encontrado",
          message: "No se encontró el contacto solicitado",
          code: "CONTACT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener el contacto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Actualizar estado de contacto (admin)
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["pending", "resolved", "spam"].includes(status)) {
        return res.status(400).json({
          error: "Estado inválido",
          message: "El estado debe ser: pending, resolved o spam",
          code: "INVALID_STATUS",
        });
      }

      const contact = await Contact.findByPk(id);

      if (!contact) {
        return res.status(404).json({
          error: "Contacto no encontrado",
          message: "No se encontró el contacto solicitado",
          code: "CONTACT_NOT_FOUND",
        });
      }

      await contact.update({ status });

      res.json({
        success: true,
        message: "Estado actualizado exitosamente",
        data: contact,
      });
    } catch (error) {
      console.error("Error updating contact status:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al actualizar el estado del contacto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Eliminar contacto (admin)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const contact = await Contact.findByPk(id);

      if (!contact) {
        return res.status(404).json({
          error: "Contacto no encontrado",
          message: "No se encontró el contacto solicitado",
          code: "CONTACT_NOT_FOUND",
        });
      }

      await contact.destroy();

      res.json({
        success: true,
        message: "Contacto eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al eliminar el contacto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Obtener estadísticas de contactos (admin)
  static async getStats(req: Request, res: Response) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay()),
      );
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalContacts,
        pendingContacts,
        resolvedContacts,
        spamContacts,
        todayContacts,
        weekContacts,
        monthContacts,
        recentContacts,
      ] = await Promise.all([
        Contact.count(),
        Contact.count({ where: { status: "pending" } }),
        Contact.count({ where: { status: "resolved" } }),
        Contact.count({ where: { status: "spam" } }),
        Contact.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
        Contact.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
        Contact.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
        Contact.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: [
            "id",
            "nombre",
            "email",
            "asunto",
            "status",
            "createdAt",
          ],
        }),
      ]);

      res.json({
        success: true,
        data: {
          totals: {
            total: totalContacts,
            pending: pendingContacts,
            resolved: resolvedContacts,
            spam: spamContacts,
          },
          periods: {
            today: todayContacts,
            thisWeek: weekContacts,
            thisMonth: monthContacts,
          },
          recentContacts,
        },
      });
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al obtener las estadísticas",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Marcar múltiples contactos como resueltos (admin)
  static async bulkResolve(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "IDs inválidos",
          message: "Debe proporcionar una lista de IDs válidos",
          code: "INVALID_IDS",
        });
      }

      const [updatedCount] = await Contact.update(
        { status: "resolved" },
        { where: { id: { [Op.in]: ids } } },
      );

      res.json({
        success: true,
        message: `${updatedCount} contactos marcados como resueltos`,
        data: { updatedCount },
      });
    } catch (error) {
      console.error("Error bulk resolving contacts:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "Error al actualizar los contactos",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}
