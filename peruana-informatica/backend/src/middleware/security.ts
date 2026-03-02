import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit para API general
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // Configurable via env
  'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde'
);

// Rate limit para búsquedas
export const searchRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minuto
  parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '200'), // Configurable via env
  'Demasiadas búsquedas desde esta IP, intenta de nuevo más tarde'
);

// Sanitización básica de inputs
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  // req.query es de solo lectura, no se puede modificar directamente
  // req.params también es de solo lectura
  // Solo sanitizamos req.body que es modificable
  
  next();
};

// Headers de seguridad
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};
