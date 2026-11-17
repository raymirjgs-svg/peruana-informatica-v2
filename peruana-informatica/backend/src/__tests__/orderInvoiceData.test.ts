import express from 'express';
import request from 'supertest';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { createOrder } from '../controllers/OrderController';

jest.mock('../models/Product', () => ({
    Product: {
        findAll: jest.fn(),
    },
}));

jest.mock('../models/Order', () => ({
    Order: {
        create: jest.fn(),
    },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: {
        bulkCreate: jest.fn(),
    },
}));

jest.mock('../models/Setting', () => ({
    Setting: {
        findByPk: jest.fn(async () => ({ value: 'direct' })),
    },
}));

jest.mock('../database/connection', () => ({
    sequelize: {
        transaction: jest.fn(async () => ({
            commit: jest.fn(async () => undefined),
            rollback: jest.fn(async () => undefined),
        })),
    },
}));

jest.mock('../services/EmailService', () => ({
    EmailService: jest.fn().mockImplementation(() => ({
        sendOrderConfirmationToClient: jest.fn(async () => undefined),
        sendNewOrderNotificationToAdmin: jest.fn(async () => undefined),
    })),
}));

const mockedFindAll = Product.findAll as jest.Mock;
const mockedCreate = Order.create as jest.Mock;

const producto = {
    cod_producto: 1132,
    name: 'WATCH ONN GOOGLE TV 4K UHD STREAMING BOX',
    price: 249.0,
    stock: 9,
};

describe('Datos de facturacion del pedido', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.post('/api/orders', createOrder);
    });

    beforeEach(() => {
        mockedFindAll.mockReset();
        mockedCreate.mockReset();
        mockedFindAll.mockResolvedValue([{ ...producto }]);
        mockedCreate.mockResolvedValue({ id: 1, tracking_code: 'PI-ABC234-DEF567' });
    });

    const pedidoBase = {
        customer_name: 'Cliente Prueba',
        customer_email: 'cliente@prueba.test',
        customer_phone: '999999999',
        customer_document: '12345678',
        items: [{ product_id: 1132, quantity: 1 }],
    };

    it('guarda boleta por defecto y sin datos de factura', async () => {
        const response = await request(app).post('/api/orders').send(pedidoBase);

        expect(response.status).toBe(201);
        const valores = mockedCreate.mock.calls[0][0];
        expect(valores.invoice_type).toBe('boleta');
        expect(valores.ruc).toBeNull();
        expect(valores.business_name).toBeNull();
        expect(valores.tax_address).toBeNull();
    });

    it('guarda los datos de factura cuando el cliente pide factura', async () => {
        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            invoice_type: 'factura',
            ruc: '20123456789',
            business_name: 'MI EMPRESA S.A.C.',
            tax_address: 'Av. Siempre Viva 742, Lima',
        });

        expect(response.status).toBe(201);
        const valores = mockedCreate.mock.calls[0][0];
        expect(valores.invoice_type).toBe('factura');
        expect(valores.ruc).toBe('20123456789');
        expect(valores.business_name).toBe('MI EMPRESA S.A.C.');
        expect(valores.tax_address).toBe('Av. Siempre Viva 742, Lima');
    });

    it('rechaza factura sin RUC valido', async () => {
        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            invoice_type: 'factura',
            business_name: 'MI EMPRESA S.A.C.',
        });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_RUC');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza factura con RUC de longitud incorrecta', async () => {
        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            invoice_type: 'factura',
            ruc: '2012345678',
            business_name: 'MI EMPRESA S.A.C.',
        });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_RUC');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza factura sin razon social', async () => {
        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            invoice_type: 'factura',
            ruc: '20123456789',
        });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('MISSING_BUSINESS_NAME');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza un tipo de comprobante desconocido', async () => {
        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            invoice_type: 'nota_credito',
        });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_INVOICE_TYPE');
        expect(mockedCreate).not.toHaveBeenCalled();
    });
});
