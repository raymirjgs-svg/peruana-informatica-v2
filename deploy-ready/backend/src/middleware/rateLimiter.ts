import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints (login, register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Moderate limiter for creation endpoints (orders, contact)
export const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 creation requests per hour
    message: {
        success: false,
        message: 'Has excedido el límite de creación de recursos. Por favor intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict limiter for payment endpoints
export const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 payment requests per hour
    message: {
        success: false,
        message: 'Demasiadas solicitudes de pago. Por favor contacta a soporte si esto es un error.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
