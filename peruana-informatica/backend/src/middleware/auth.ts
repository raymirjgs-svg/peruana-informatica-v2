import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Credenciales básicas para desarrollo
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123",
};

// Middleware de autenticación básica
export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({
      error: "Acceso no autorizado",
      message: "Se requiere autenticación básica",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    // Decodificar credenciales Base64
    const base64Credentials = authHeader.split(" ")[1];

    if (!base64Credentials) {
      return res.status(401).json({
        error: "Error de autenticación",
        message: "Formato de credenciales inválido",
        code: "AUTH_ERROR",
      });
    }

    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii",
    );
    const [username, password] = credentials.split(":");

    // Verificar credenciales
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      next();
    } else {
      return res.status(401).json({
        error: "Credenciales inválidas",
        message: "Usuario o contraseña incorrectos",
        code: "INVALID_CREDENTIALS",
      });
    }
  } catch (error) {
    return res.status(401).json({
      error: "Error de autenticación",
      message: "Formato de credenciales inválido",
      code: "AUTH_ERROR",
    });
  }
};

// Middleware para generar token de sesión simple (opcional)
export const generateSessionToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Generar un token criptográficamente seguro para la sesión
  const sessionToken = crypto.randomBytes(32).toString("base64");
  res.setHeader("X-Session-Token", sessionToken);
  next();
};
