import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { Order } from '../models/Order';
import { downloadInvoiceByTrackingCode } from '../controllers/OrderTrackingController';
import { INVOICE_DIR } from '../utils/invoicePaths';

jest.mock('../models/Order', () => ({
    Order: { findOne: jest.fn(), findByPk: jest.fn() },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: { findAll: jest.fn(), bulkCreate: jest.fn() },
}));

jest.mock('../services/MercadoPagoService', () => ({
    isMercadoPagoEnabled: jest.fn(async () => true),
    createOrderPreference: jest.fn(),
    syncMercadoPagoStatus: jest.fn(),
    handleMercadoPagoNotification: jest.fn(),
}));

jest.mock('../services/PaymentSettingsService', () => ({
    getPublicPaymentMethods: jest.fn(async () => ({ methods: [], details: {} })),
}));

const mockedFindOne = Order.findOne as jest.Mock;

describe('Descarga del comprobante por codigo de seguimiento', () => {
    let app: express.Application;
    let archivo: string;

    beforeAll(() => {
        app = express();
        app.get('/api/orders/track/:code/invoice', downloadInvoiceByTrackingCode);

        if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });
        archivo = path.join(INVOICE_DIR, 'test-boleta.pdf');
        fs.writeFileSync(archivo, '%PDF-1.4 prueba');
    });

    afterAll(() => {
        if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
    });

    beforeEach(() => mockedFindOne.mockReset());

    const pedido = (over: Record<string, any> = {}) => ({
        id: 42,
        tracking_code: 'PI-ABC234-DEF567',
        invoice_type: 'factura',
        invoice_number: 'F001-00001',
        invoice_file: 'test-boleta.pdf',
        status: 'processed',
        payment_status: 'verified',
        ...over,
    });

    it('devuelve 404 si el codigo no existe', async () => {
        mockedFindOne.mockResolvedValue(null);

        const response = await request(app).get('/api/orders/track/PI-XXXXXX-XXXXXX/invoice');

        expect(response.status).toBe(404);
    });

    it('devuelve 404 con mensaje claro si el comprobante aun no esta disponible', async () => {
        mockedFindOne.mockResolvedValue(pedido({ invoice_file: null }));

        const response = await request(app).get('/api/orders/track/PI-ABC234-DEF567/invoice');

        expect(response.status).toBe(404);
        expect(response.body.message).toContain('todavía no está disponible');
    });

    it('devuelve 404 si el archivo fue borrado del disco', async () => {
        mockedFindOne.mockResolvedValue(pedido({ invoice_file: 'no-existe.pdf' }));

        const response = await request(app).get('/api/orders/track/PI-ABC234-DEF567/invoice');

        expect(response.status).toBe(404);
    });

    it('descarga el PDF cuando el comprobante esta cargado', async () => {
        mockedFindOne.mockResolvedValue(pedido());

        const response = await request(app).get('/api/orders/track/PI-ABC234-DEF567/invoice');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/pdf');
        expect(response.headers['content-disposition']).toContain('Factura-F001-00001.pdf');
    });

    it('no permite salir del directorio de comprobantes', async () => {
        mockedFindOne.mockResolvedValue(pedido({ invoice_file: '../../../../etc/passwd' }));

        const response = await request(app).get('/api/orders/track/PI-ABC234-DEF567/invoice');

        expect(response.status).toBe(404);
    });
});
