/**
 * Error personalizado para errores de API
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                details: this.details,
            },
        };
    }
}

/**
 * Error para recursos no encontrados (404)
 */
export class NotFoundError extends ApiError {
    constructor(resource: string, id?: string | number) {
        const message = id
            ? `${resource} con ID ${id} no encontrado`
            : `${resource} no encontrado`;
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Error para validación de datos (400)
 */
export class ValidationError extends ApiError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Error para autenticación (401)
 */
export class AuthenticationError extends ApiError {
    constructor(message: string = 'No autenticado') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'AuthenticationError';
    }
}

/**
 * Error para autorización (403)
 */
export class AuthorizationError extends ApiError {
    constructor(message: string = 'No autorizado') {
        super(message, 403, 'FORBIDDEN');
        this.name = 'AuthorizationError';
    }
}

/**
 * Error de conexión con servicio externo
 */
export class ServiceUnavailableError extends ApiError {
    constructor(service: string) {
        super(`Servicio ${service} no disponible`, 503, 'SERVICE_UNAVAILABLE');
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Error de conexión de red
 */
export class NetworkError extends Error {
    constructor(message: string = 'Error de conexión') {
        super(message);
        this.name = 'NetworkError';
    }
}

/**
 * Tipo guard para verificar si es ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/**
 * Convierte error desconocido en ApiError
 */
export function toApiError(error: unknown): ApiError {
    if (isApiError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return new ApiError(error.message);
    }

    return new ApiError('Error desconocido');
}

/**
 * Maneja errores de fetch y convierte en errores apropiados
 */
export async function handleFetchError(response: Response): Promise<never> {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    let errorDetails;

    try {
        const data = await response.json();
        errorMessage = data.message || data.error || errorMessage;
        errorDetails = data.details;
    } catch {
        // Si no se puede parsear JSON, usar mensaje por defecto
    }

    switch (response.status) {
        case 404:
            throw new NotFoundError(errorMessage);
        case 400:
            throw new ValidationError(errorMessage, errorDetails);
        case 401:
            throw new AuthenticationError(errorMessage);
        case 403:
            throw new AuthorizationError(errorMessage);
        case 503:
            throw new ServiceUnavailableError(errorMessage);
        default:
            throw new ApiError(errorMessage, response.status, undefined, errorDetails);
    }
}

/**
 * Wrapper seguro para operaciones asíncronas
 * Retorna [error, data] tuple
 */
export async function safeAsync<T>(
    promise: Promise<T>
): Promise<[null, T] | [Error, null]> {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        return [error instanceof Error ? error : new Error(String(error)), null];
    }
}

/**
 * Retry automático para operaciones fallidas
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }

    throw lastError!;
}
