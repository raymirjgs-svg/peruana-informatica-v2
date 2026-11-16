import {
    generateTrackingCode,
    normalizeTrackingCode,
    TRACKING_CODE_PATTERN,
} from '../utils/trackingCode';

describe('trackingCode', () => {
    it('genera un código con el formato público esperado', () => {
        expect(generateTrackingCode()).toMatch(TRACKING_CODE_PATTERN);
        expect(generateTrackingCode()).toMatch(/^PI-[2-9A-HJKMNP-TV-Z]{6}-[2-9A-HJKMNP-TV-Z]{6}$/);
    });

    it('nunca incluye caracteres ambiguos en la parte aleatoria', () => {
        for (let index = 0; index < 1000; index++) {
            const randomPart = generateTrackingCode().replace(/^PI-/, '').replace('-', '');
            expect(randomPart).not.toMatch(/[01ILOU]/);
        }
    });

    it('genera códigos únicos en una muestra grande', () => {
        const codes = new Set(Array.from({ length: 10000 }, () => generateTrackingCode()));
        expect(codes.size).toBe(10000);
    });

    it('normaliza códigos escritos en minúsculas o con espacios', () => {
        const code = generateTrackingCode();
        expect(normalizeTrackingCode(`  ${code.toLowerCase()}  `)).toBe(code);
    });

    it('rechaza formatos que no corresponden a un código válido', () => {
        expect(normalizeTrackingCode('1')).toBeNull();
        expect(normalizeTrackingCode('PI-123456-ABCDEF')).toBeNull();
        expect(normalizeTrackingCode('../../etc/passwd')).toBeNull();
        expect(normalizeTrackingCode(null)).toBeNull();
    });
});
