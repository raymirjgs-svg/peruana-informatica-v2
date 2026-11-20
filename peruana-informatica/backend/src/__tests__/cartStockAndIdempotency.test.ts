import express from 'express';
import request from 'supertest';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { createOrder } from '../controllers/OrderController';
import { cartController } from '../controllers/cartController';

jest.mock('../models/Product', () => ({
    Product: {
        findAll: jest.fn(),
    },
}));

jest.mock('../models/Order', () => ({
    Order: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: {
        bulkCreate: jest.fn(),
    },
}));

jest.mock('../models/Coupon', () => ({
    Coupon: {
        findOne: jest.fn(),
    },
}));

jest.mock('../models/Setting', () => ({
    Setting: {
        findByPk: jest.fn(async () => ({ value: 'direct' })),
    },
}));

jest.mock('../models/Cart', () => ({
    Cart: {
        findOrCreate: jest.fn(),
        findOne: jest.fn(),
    },
}));

jest.mock('../models/CartItem', () => ({
    CartItem: {
        findAll: jest.fn(),
        findOrCreate: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
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

const mockedProductFindAll = Product.findAll as jest.Mock;
const mockedOrderFindOne = Order.findOne as jest.Mock;
const mockedOrderCreate = Order.create as jest.Mock;

const producto = {
    cod_producto: 1132,
    name: 'WATCH ONN GOOGLE TV',
    price: 249.0,
    price_web: 239.0,
    stock: 3,
};

describe('Idempotencia de pedidos', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.post('/api/orders', createOrder);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockedProductFindAll.mockResolvedValue([producto]);
    });

    it('devuelve el mismo pedido cuando la clave de idempotencia ya existe', async () => {
        const existente = {
            id: 77,
            tracking_code: 'PI-ABC234-DEF567',
            status: 'pending_approval',
        };
        mockedOrderFindOne.mockResolvedValue(existente);

        const response = await request(app)
            .post('/api/orders')
            .send({
                customer_name: 'Cliente',
                customer_email: 'cliente@prueba.test',
                items: [{ product_id: producto.cod_producto, quantity: 1 }],
                idempotency_key: 'clave-de-prueba-123',
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.duplicate).toBe(true);
        expect(response.body.order_id).toBe(77);
        expect(response.body.tracking_code).toBe('PI-ABC234-DEF567');
        // No se crea un pedido nuevo
        expect(mockedOrderCreate).not.toHaveBeenCalled();
    });

    it('ignora una clave con formato invalido y crea el pedido', async () => {
        mockedOrderFindOne.mockResolvedValue(null);
        mockedOrderCreate.mockResolvedValue({
            id: 88,
            tracking_code: 'PI-ZZZ111-YYY222',
            status: 'pending',
        });

        const response = await request(app)
            .post('/api/orders')
            .send({
                customer_name: 'Cliente',
                customer_email: 'cliente@prueba.test',
                items: [{ product_id: producto.cod_producto, quantity: 1 }],
                idempotency_key: 'no valida!!',
            })
            .expect(201);

        expect(response.body.order_id).toBe(88);
        expect(mockedOrderCreate).toHaveBeenCalledTimes(1);
        // La clave invalida no se guarda
        const creado = mockedOrderCreate.mock.calls[0][0];
        expect(creado.idempotency_key).toBeNull();
    });
});

describe('Carrito del servidor: stock y total', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use((req: any, _res, next) => {
            req.user = { id: 1 };
            next();
        });
        app.get('/api/cart', cartController.getCart);
        app.post('/api/cart/sync', cartController.syncCart);
        app.post('/api/cart/item', cartController.updateItem);
    });

    const { Cart } = require('../models/Cart');
    const { CartItem } = require('../models/CartItem');

    beforeEach(() => {
        jest.clearAllMocks();
        mockedProductFindAll.mockResolvedValue([producto]);
        Cart.findOrCreate.mockResolvedValue([{ id: 1, user_id: 1, status: 'active' }, false]);
        CartItem.findAll.mockResolvedValue([]);
        CartItem.findOrCreate.mockResolvedValue([{ id: 5, cart_id: 1, product_id: 1132, quantity: 1 }, true]);
    });

    it('rechaza sincronizar mas unidades de las que hay en stock', async () => {
        const response = await request(app)
            .post('/api/cart/sync')
            .send({ items: [{ id: producto.cod_producto, quantity: 99 }] })
            .expect(400);

        expect(response.body.code).toBe('INSUFFICIENT_STOCK');
        expect(response.body.products[0].available).toBe(producto.stock);
        expect(CartItem.create).not.toHaveBeenCalled();
    });

    it('rechaza una cantidad invalida', async () => {
        const response = await request(app)
            .post('/api/cart/item')
            .send({ productId: producto.cod_producto, quantity: -3 })
            .expect(400);

        expect(response.body.code).toBe('INVALID_QUANTITY');
    });

    it('rechaza agregar al carrito mas de lo que hay en stock', async () => {
        const response = await request(app)
            .post('/api/cart/item')
            .send({ productId: producto.cod_producto, quantity: 10 })
            .expect(400);

        expect(response.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('calcula el total en el servidor con el precio de la base de datos', async () => {
        CartItem.findAll.mockResolvedValue([
            { id: 1, cart_id: 1, product_id: producto.cod_producto, quantity: 2, product: producto },
        ]);

        const response = await request(app).get('/api/cart').expect(200);

        // 2 x 249.00 (price), no price_web
        expect(response.body.total).toBe(498);
    });
});
