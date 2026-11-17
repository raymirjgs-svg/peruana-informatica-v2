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
        sendOrderNotification: jest.fn(async () => undefined),
    })),
}));

const mockedFindAll = Product.findAll as jest.Mock;
const mockedCreate = Order.create as jest.Mock;

const productoConPrecio = {
    cod_producto: 1132,
    name: 'WATCH ONN GOOGLE TV 4K UHD STREAMING BOX',
    price: 249.0,
    stock: 9,
};

describe('Creacion de pedidos: precio y stock se validan en el servidor', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.post('/api/orders', createOrder);
    });

    beforeEach(() => {
        mockedFindAll.mockReset();
        mockedCreate.mockReset();
        mockedCreate.mockResolvedValue({ id: 1, tracking_code: 'PI-ABC234-DEF567' });
    });

    const pedidoValido = {
        customer_name: 'Cliente Prueba',
        customer_email: 'cliente@prueba.test',
        customer_phone: '999999999',
        customer_document: '12345678',
        items: [{ product_id: 1132, quantity: 1 }],
    };

    it('rechaza el pedido si el producto no tiene precio publicado', async () => {
        mockedFindAll.mockResolvedValue([{ ...productoConPrecio, price: 0 }]);

        const response = await request(app).post('/api/orders').send(pedidoValido);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('PRODUCT_WITHOUT_PRICE');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza el pedido si no hay stock suficiente', async () => {
        mockedFindAll.mockResolvedValue([{ ...productoConPrecio, stock: 1 }]);

        const response = await request(app)
            .post('/api/orders')
            .send({ ...pedidoValido, items: [{ product_id: 1132, quantity: 5 }] });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INSUFFICIENT_STOCK');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza cantidades invalidas', async () => {
        mockedFindAll.mockResolvedValue([{ ...productoConPrecio }]);

        const response = await request(app)
            .post('/api/orders')
            .send({ ...pedidoValido, items: [{ product_id: 1132, quantity: 0 }] });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_QUANTITY');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('acepta el pedido con precio y stock validos', async () => {
        mockedFindAll.mockResolvedValue([{ ...productoConPrecio }]);

        const response = await request(app).post('/api/orders').send(pedidoValido);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mockedCreate).toHaveBeenCalledTimes(1);
        // El total se calcula en el servidor con el precio del catalogo.
        const valores = mockedCreate.mock.calls[0][0];
        expect(valores.total_amount).toBe(249);
    });
});
