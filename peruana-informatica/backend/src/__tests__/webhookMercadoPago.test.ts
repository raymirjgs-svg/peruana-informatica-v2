import express from 'express';
import request from 'supertest';
import { paymentController } from '../controllers/PaymentController';

jest.mock('../models/Order', () => ({
    Order: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: { findAll: jest.fn(), bulkCreate: jest.fn() },
}));

jest.mock('../models/Cart', () => ({ Cart: { findOne: jest.fn() } }));
jest.mock('../models/CartItem', () => ({ CartItem: { findAll: jest.fn(), bulkCreate: jest.fn() } }));
jest.mock('../models/Product', () => ({ Product: { findAll: jest.fn(), findOne: jest.fn() } }));
jest.mock('../models/User', () => ({ User: { findOne: jest.fn() } }));
jest.mock('../models/Setting', () => ({ Setting: { findByPk: jest.fn(async () => null) } }));
jest.mock('../database/connection', () => ({
    sequelize: { transaction: jest.fn(async () => ({ commit: jest.fn(), rollback: jest.fn() })) },
}));

jest.mock('../services/MercadoPagoService', () => ({
    isMercadoPagoEnabled: jest.fn(async () => true),
    createOrderPreference: jest.fn(),
    syncMercadoPagoStatus: jest.fn(),
    handleMercadoPagoNotification: jest.fn(async () => 42),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpService = require('../services/MercadoPagoService');

describe('Webhook de Mercado Pago', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.post('/api/payments/webhook', paymentController.receiveWebhook);
    });

    beforeEach(() => {
        (mpService.handleMercadoPagoNotification as jest.Mock).mockClear();
    });

    it('lee el id del pago del BODY (form-urlencoded) que es como lo envia Mercado Pago', async () => {
        const response = await request(app)
            .post('/api/payments/webhook')
            .type('form')
            .send({ id: '12345', type: 'payment', 'data.id': '99999', action: 'payment.updated' });

        expect(response.status).toBe(200);
        expect(mpService.handleMercadoPagoNotification).toHaveBeenCalledWith('99999');
    });

    it('lee el id del pago del BODY en JSON', async () => {
        const response = await request(app)
            .post('/api/payments/webhook')
            .send({ type: 'payment', data: { id: 77777 } });

        expect(response.status).toBe(200);
        expect(mpService.handleMercadoPagoNotification).toHaveBeenCalledWith('77777');
    });

    it('acepta data como JSON string', async () => {
        const response = await request(app)
            .post('/api/payments/webhook')
            .type('form')
            .send({ type: 'payment', data: '{"id":88888}' });

        expect(response.status).toBe(200);
        expect(mpService.handleMercadoPagoNotification).toHaveBeenCalledWith('88888');
    });

    it('no procesa notificaciones que no son de pago', async () => {
        const response = await request(app)
            .post('/api/payments/webhook')
            .type('form')
            .send({ type: 'merchant_order', id: '12345' });

        expect(response.status).toBe(200);
        expect(mpService.handleMercadoPagoNotification).not.toHaveBeenCalled();
    });
});
