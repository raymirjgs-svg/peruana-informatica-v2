import { Request, Response, NextFunction } from 'express';
import { logger, logRequest } from '../config/logger';
import { redactSensitiveUrl } from '../utils/redactSensitiveUrl';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req.method, redactSensitiveUrl(req.originalUrl), res.statusCode, duration);
    });

    next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: redactSensitiveUrl(req.originalUrl),
        ip: req.ip
    });

    next(err);
};
