import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

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

export const sendError = (
  res: Response,
  error: unknown,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR'
) => {
  const detail = error instanceof Error ? error.message : String(error);
  logger.error(message, { detail, statusCode, code });

  return res.status(statusCode).json({
    success: false,
    message,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  });
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = statusCode >= 500 ? 'Error interno del servidor' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  logger.info(`404 Not Found: ${req.method} ${req.originalUrl}`);
  next(new CustomError('Recurso no encontrado', 404, 'NOT_FOUND'));
};
