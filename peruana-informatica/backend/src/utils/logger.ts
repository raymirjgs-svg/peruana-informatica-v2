import { Request, Response, NextFunction } from 'express';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogData {
    [key: string]: any;
}

/**
 * Logger centralizado para el backend
 * Proporciona logging consistente con timestamps y niveles
 */
class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private logLevel = process.env.LOG_LEVEL || 'info';
    private enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';

    private levelPriority: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        success: 2,
        warn: 3,
        error: 4,
    };

    private shouldLog(level: LogLevel): boolean {
        const currentPriority = this.levelPriority[this.logLevel as LogLevel] || 1;
        const messagePriority = this.levelPriority[level];
        return messagePriority >= currentPriority;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const emoji = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            debug: '🔍',
            success: '✅',
        }[level];

        return `${emoji} [${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    private log(level: LogLevel, message: string, data?: LogData) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message);

        switch (level) {
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }

        if (data && this.isDevelopment) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    /**
     * Log de información general
     */
    info(message: string, data?: LogData) {
        this.log('info', message, data);
    }

    /**
     * Log de operaciones exitosas
     */
    success(message: string, data?: LogData) {
        this.log('success', message, data);
    }

    /**
     * Log de advertencias
     */
    warn(message: string, data?: LogData) {
        this.log('warn', message, data);
    }

    /**
     * Log de errores
     */
    error(message: string, error?: any) {
        this.log('error', message);

        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined,
            });
        } else if (error) {
            console.error('Error data:', error);
        }
    }

    /**
     * Log de debugging (solo en desarrollo)
     */
    debug(message: string, data?: LogData) {
        if (this.isDevelopment) {
            this.log('debug', message, data);
        }
    }

    /**
     * Log de requests HTTP
     */
    request(req: Request) {
        if (!this.enableRequestLogging) return;

        const message = `${req.method} ${req.path}`;
        const data: LogData = {
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };

        // Solo loguear body en desarrollo y excluir campos sensibles
        if (this.isDevelopment && req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = { ...req.body };
            // Remover campos sensibles
            delete sanitizedBody.password;
            delete sanitizedBody.token;
            delete sanitizedBody.apiKey;
            data.body = sanitizedBody;
        }

        this.debug(message, data);
    }

    /**
     * Log de responses HTTP
     */
    response(req: Request, res: Response, startTime: number) {
        if (!this.enableRequestLogging) return;

        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const message = `${req.method} ${req.path} ${status} - ${duration}ms`;

        if (status >= 500) {
            this.error(message);
        } else if (status >= 400) {
            this.warn(message);
        } else {
            this.debug(message);
        }
    }

    /**
     * Log de queries de base de datos (para debugging)
     */
    query(sql: string, params?: any[], duration?: number) {
        if (!this.isDevelopment) return;

        const message = duration
            ? `Database query (${duration}ms)`
            : 'Database query';

        this.debug(message, { sql, params });
    }

    /**
     * Log de operaciones de caché
     */
    cache(action: 'hit' | 'miss' | 'set' | 'delete', key: string) {
        if (!this.isDevelopment) return;

        const emoji = {
            hit: '🎯',
            miss: '❌',
            set: '💾',
            delete: '🗑️',
        }[action];

        this.debug(`${emoji} Cache ${action}: ${key}`);
    }

    /**
     * Log de inicio/fin de operaciones largas
     */
    operation(name: string, data?: LogData) {
        const startTime = Date.now();
        this.info(`Starting: ${name}`, data);

        return {
            end: (result?: 'success' | 'error', additionalData?: LogData) => {
                const duration = Date.now() - startTime;
                const message = `Finished: ${name} (${duration}ms)`;

                if (result === 'error') {
                    this.error(message, additionalData);
                } else {
                    this.success(message, additionalData);
                }
            },
        };
    }
}

// Singleton instance
export const logger = new Logger();

/**
 * Middleware para logging automático de requests
 */
export function requestLoggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const startTime = Date.now();

    logger.request(req);

    // Log response cuando termine
    res.on('finish', () => {
        logger.response(req, res, startTime);
    });

    next();
}

/**
 * Utilidad para loguear errores de forma consistente
 */
export function logError(context: string, error: unknown, additionalData?: LogData) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`${context}: ${errorMessage}`, error);

    if (additionalData) {
        logger.debug('Additional error context', additionalData);
    }
}

export default logger;
