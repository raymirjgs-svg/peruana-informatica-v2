import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { redactSensitiveUrl } from '../utils/redactSensitiveUrl';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'CustomError';
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    message: redactSensitiveUrl(err.message),
    stack: err.stack ? redactSensitiveUrl(err.stack) : err.stack,
    url: redactSensitiveUrl(req.url),
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  // Nunca devolver la URL original: podria contener el codigo privado de seguimiento.
  const message = statusCode === 500
    ? 'Error interno del servidor'
    : statusCode === 404
      ? 'Recurso no encontrado'
      : redactSensitiveUrl(err.message);

  res.status(statusCode).json({
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack ? redactSensitiveUrl(err.stack) : err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const safeUrl = redactSensitiveUrl(req.originalUrl);
  logger.warn(`404 Not Found: ${req.method} ${safeUrl}`);
  const error = new Error(`Recurso no encontrado - ${safeUrl}`);
  (error as any).statusCode = 404;
  next(error);
};
