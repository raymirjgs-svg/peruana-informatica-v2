import express from 'express';
import request from 'supertest';
import { Order } from '../models/Order';
import {
    createPaymentPreferenceByTrackingCode,
} from '../controllers/OrderTrackingController';

jest.mock('../models/Order', () => ({
    Order: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
    },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: {
        findAll: jest.fn(),
    },
}));

jest.mock('../services/MercadoPagoService', () => ({
    isMercadoPagoEnabled: jest.fn(() => true),
    createOrderPreference: jest.fn(),
    syncMercadoPagoStatus: jest.fn(),
    handleMercadoPagoNotification: jest.fn(),
}));

jest.mock('../services/PaymentSettingsService', () => ({
    getPublicPaymentMethods: jest.fn(async () => ({
        methods: ['mercadopago'],
        details: { mercadopago: { enabled: true } },
    })),
}));

const mockedFindOne = Order.findOne as jest.Mock;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpService = require('../services/MercadoPagoService');

const baseOrder = {
    id: 42,
    tracking_code: 'PI-ABC234-DEF567',
    customer_name: 'Nombre Privado',
    customer_email: 'cliente@privado.test',
    customer_phone: '999999999',
    total_amount: '123.45',
    status: 'processed',
    payment_status: 'pending',
    payment_method: null,
    payment_proof: null,
    createdAt: new Date('2026-11-16T10:00:00.000Z'),
    updatedAt: new Date('2026-11-16T11:00:00.000Z'),
    items: [],
    save: jest.fn(async function (this: any) { return this; }),
};

describe('Flujo de pago por codigo de seguimiento', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.post('/api/orders/track/:code/payment-preference', createPaymentPreferenceByTrackingCode);
    });

    beforeEach(() => {
        mockedFindOne.mockReset();
        mpService.createOrderPreference.mockReset();
        mpService.isMercadoPagoEnabled.mockReturnValue(true);
    });

    it('permite crear la preferencia de Mercado Pago con un pedido aprobado', async () => {
        mockedFindOne.mockResolvedValue({ ...baseOrder });
        mpService.createOrderPreference.mockResolvedValue({
            preferenceId: 'pref-123',
            init_point: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=pref-123',
        });

        const response = await request(app)
            .post('/api/orders/track/PI-ABC234-DEF567/payment-preference')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.init_point).toContain('mercadopago');
        // El id interno nunca se expone
        expect(JSON.stringify(response.body)).not.toContain('"id":42');
    });

    it('rechaza crear la preferencia si el pedido no esta aprobado', async () => {
        mockedFindOne.mockResolvedValue({ ...baseOrder, status: 'pending_approval' });

        const response = await request(app)
            .post('/api/orders/track/PI-ABC234-DEF567/payment-preference')
            .expect(409);

        expect(response.body.success).toBe(false);
        expect(mpService.createOrderPreference).not.toHaveBeenCalled();
    });

    it('rechaza crear la preferencia si el pago ya fue verificado', async () => {
        mockedFindOne.mockResolvedValue({ ...baseOrder, payment_status: 'verified' });

        await request(app)
            .post('/api/orders/track/PI-ABC234-DEF567/payment-preference')
            .expect(409);

        expect(mpService.createOrderPreference).not.toHaveBeenCalled();
    });

    it('devuelve 404 con un codigo invalido sin tocar la base de datos', async () => {
        await request(app)
            .post('/api/orders/track/123/payment-preference')
            .expect(404);

        expect(mockedFindOne).not.toHaveBeenCalled();
    });

    it('no expone un endpoint para subir comprobantes: el pago es solo con Mercado Pago', async () => {
        // El flujo legacy (subir comprobante) fue eliminado: el unico metodo
        // de cobro es Mercado Pago.
        mockedFindOne.mockResolvedValue({ ...baseOrder });

        await request(app)
            .post('/api/orders/track/PI-ABC234-DEF567/payment-proof')
            .send({ payment_method: 'transferencia' })
            .expect(404);

        expect(mockedFindOne).not.toHaveBeenCalled();
    });
});
