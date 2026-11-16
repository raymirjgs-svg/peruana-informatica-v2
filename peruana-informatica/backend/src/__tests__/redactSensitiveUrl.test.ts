import { redactSensitiveUrl } from '../utils/redactSensitiveUrl';

describe('redactSensitiveUrl', () => {
    it('redacta el codigo en la ruta publica de tracking', () => {
        expect(redactSensitiveUrl('/api/orders/track/PI-ABC234-DEF567'))
            .toBe('/api/orders/track/[TRACKING_CODE_REDACTED]');
    });

    it('redacta el codigo en la ruta del frontend', () => {
        expect(redactSensitiveUrl('/seguimiento/PI-ABC234-DEF567?ref=email'))
            .toBe('/seguimiento/[TRACKING_CODE_REDACTED]?ref=email');
    });

    it('redacta el codigo en query params', () => {
        expect(redactSensitiveUrl('/api/orders/track?code=PI-ABC234-DEF567'))
            .toBe('/api/orders/track?code=[TRACKING_CODE_REDACTED]');
        expect(redactSensitiveUrl('/x?tracking_code=PI-ABC234-DEF567'))
            .toBe('/x?tracking_code=[TRACKING_CODE_REDACTED]');
    });

    it('no modifica URLs sin codigos de seguimiento', () => {
        expect(redactSensitiveUrl('/api/products?page=1')).toBe('/api/products?page=1');
        expect(redactSensitiveUrl('/api/client/orders/1')).toBe('/api/client/orders/1');
    });

    it('redacta multiples ocurrencias', () => {
        const redacted = redactSensitiveUrl('/seguimiento/PI-ABC234-DEF567 -> /api/orders/track/PI-XYZ789-UVW012');
        expect(redacted).not.toContain('PI-ABC234-DEF567');
        expect(redacted).not.toContain('PI-XYZ789-UVW012');
    });
});
