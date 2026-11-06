import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (pretty for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define transports
const transports: winston.transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
];

// File transports (only in production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Error log file
    transports.push(
        new DailyRotateFile({
            dirname: logsDir,
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '30d',
            maxSize: '20m',
            format: logFormat
        })
    );

    // Combined log file
    transports.push(
        new DailyRotateFile({
            dirname: logsDir,
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
            format: logFormat
        })
    );
}

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Create stream for Morgan
export const loggerStream = {
    write: (message: string) => {
        logger.info(message.trim());
    }
};

// Helper functions for common log patterns
export const logError = (error: Error, context?: string) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        context
    });
};

export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
    logger.http({
        method,
        url,
        statusCode,
        duration: `${duration}ms`
    });
};

export const logAudit = (action: string, user: string, details?: any) => {
    logger.info({
        type: 'AUDIT',
        action,
        user,
        details,
        timestamp: new Date().toISOString()
    });
};

export default logger;
