import express from 'express';
import request from 'supertest';
import { Order } from '../models/Order';
import { getOrderByTrackingCode } from '../controllers/OrderTrackingController';

jest.mock('../models/Order', () => ({
    Order: {
        findOne: jest.fn(),
    },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: {},
}));

const mockedFindOne = Order.findOne as jest.Mock;

describe('GET /api/orders/track/:code', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.get('/api/orders/track/:code', getOrderByTrackingCode);
    });

    beforeEach(() => {
        mockedFindOne.mockReset();
    });

    it('devuelve únicamente el payload mínimo de seguimiento', async () => {
        mockedFindOne.mockResolvedValue({
            tracking_code: 'PI-ABC234-DEF567',
            customer_name: 'Nombre Privado',
            customer_email: 'cliente@privado.test',
            customer_phone: '999999999',
            customer_document: '12345678',
            tax_address: 'Dirección Privada',
            total_amount: '123.45',
            status: 'pending_approval',
            payment_status: 'pending',
            payment_method: 'transferencia',
            createdAt: new Date('2026-11-16T10:00:00.000Z'),
            updatedAt: new Date('2026-11-16T11:00:00.000Z'),
            items: [
                {
                    product_name: 'Producto de prueba',
                    quantity: 2,
                    price: '50.00',
                },
            ],
        });

        const response = await request(app)
            .get('/api/orders/track/PI-ABC234-DEF567')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tracking_code).toBe('PI-ABC234-DEF567');
        expect(response.body.data.total_amount).toBe(123.45);
        expect(response.body.data.items).toEqual([
            { product_name: 'Producto de prueba', quantity: 2 },
        ]);

        const serialized = JSON.stringify(response.body);
        expect(serialized).not.toContain('Nombre Privado');
        expect(serialized).not.toContain('cliente@privado.test');
        expect(serialized).not.toContain('999999999');
        expect(serialized).not.toContain('12345678');
        expect(serialized).not.toContain('Dirección Privada');
        expect(response.body.data.id).toBeUndefined();
    });

    it('devuelve 404 sin consultar la base para un formato inválido', async () => {
        const response = await request(app)
            .get('/api/orders/track/123')
            .expect(404);

        expect(response.body.success).toBe(false);
        expect(mockedFindOne).not.toHaveBeenCalled();
    });

    it('devuelve 404 cuando el código no existe', async () => {
        mockedFindOne.mockResolvedValue(null);

        const response = await request(app)
            .get('/api/orders/track/PI-ABC234-DEF567')
            .expect(404);

        expect(response.body.success).toBe(false);
        expect(JSON.stringify(response.body)).not.toContain('ABC234');
    });
});
