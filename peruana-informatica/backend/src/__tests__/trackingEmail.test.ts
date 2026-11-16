import { emailTemplates } from '../utils/emailTemplates';

describe('tracking email templates', () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;

    afterEach(() => {
        if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
        else process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('incluye el código y el enlace seguro en la confirmación', () => {
        process.env.FRONTEND_URL = 'https://peruanadeinformatica.com.pe';

        const html = emailTemplates.orderConfirmation(
            {
                id: 42,
                customer_name: 'Cliente de Prueba',
                tracking_code: 'PI-ABC234-DEF567',
                total_amount: 100,
            },
            []
        );

        expect(html).toContain('PI-ABC234-DEF567');
        expect(html).toContain('https://peruanadeinformatica.com.pe/seguimiento/PI-ABC234-DEF567');
        expect(html).toContain('ventas@peruanainformatica.com.pe');
        expect(html).toContain('(054) 226796');
    });

    it('no incluye datos bancarios ni contactos inventados', () => {
        process.env.FRONTEND_URL = 'https://peruanadeinformatica.com.pe';

        const html = emailTemplates.orderConfirmation(
            {
                id: 42,
                customer_name: 'Cliente de Prueba',
                tracking_code: 'PI-ABC234-DEF567',
                total_amount: 100,
            },
            []
        );

        expect(html).not.toContain('191-1234567-0-00');
        expect(html).not.toContain('00219100123456700012');
        expect(html).not.toContain('20123456789');
        expect(html).not.toContain('(01) 123-4567');
        expect(html).not.toContain('ventas@peruanainformatica.com ');
    });

    it('genera un email independiente para distribuir códigos existentes', () => {
        process.env.FRONTEND_URL = 'https://peruanadeinformatica.com.pe';

        const html = emailTemplates.trackingCode({
            id: 42,
            customer_name: 'Cliente de Prueba',
            tracking_code: 'PI-ABC234-DEF567',
        });

        expect(html).toContain('Código de seguimiento de tu pedido');
        expect(html).toContain('PI-ABC234-DEF567');
        expect(html).toContain('https://peruanadeinformatica.com.pe/seguimiento/PI-ABC234-DEF567');
        expect(html).not.toContain('191-1234567-0-00');
        expect(html).not.toContain('(01) 123-4567');
    });
});
