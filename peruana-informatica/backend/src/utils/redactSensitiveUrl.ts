const REDACTED_TRACKING_CODE = '[TRACKING_CODE_REDACTED]';

/**
 * Los codigos de seguimiento funcionan como credenciales bearer: quien los
 * conoce puede consultar el pedido. Por eso nunca deben quedar registrados
 * en logs (backend, proxy o APM).
 */
const TRACKING_CODE_PATTERNS: RegExp[] = [
    // /api/orders/track/PI-XXXXXX-XXXXXX
    /(\/api\/orders\/track\/)(PI-[A-Z0-9]+(?:-[A-Z0-9]+)*)/gi,
    // /seguimiento/PI-XXXXXX-XXXXXX
    /(\/seguimiento\/)(PI-[A-Z0-9]+(?:-[A-Z0-9]+)*)/gi,
    // ?code=PI-XXXXXX-XXXXXX / ?tracking_code=PI-XXXXXX-XXXXXX
    /([?&](?:code|tracking_code)=)(PI-[A-Z0-9]+(?:-[A-Z0-9]+)*)/gi,
];

export const redactSensitiveUrl = (value: string): string => {
    if (!value || typeof value !== 'string') return value;

    let redacted = value;
    for (const pattern of TRACKING_CODE_PATTERNS) {
        redacted = redacted.replace(pattern, `$1${REDACTED_TRACKING_CODE}`);
    }
    return redacted;
};
