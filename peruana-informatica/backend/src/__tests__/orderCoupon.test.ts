import express from 'express';
import request from 'supertest';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { createOrder } from '../controllers/OrderController';

jest.mock('../models/Product', () => ({
    Product: { findAll: jest.fn() },
}));

jest.mock('../models/Order', () => ({
    Order: { create: jest.fn() },
}));

jest.mock('../models/OrderItem', () => ({
    OrderItem: { bulkCreate: jest.fn() },
}));

jest.mock('../models/Coupon', () => ({
    Coupon: { findOne: jest.fn() },
}));

jest.mock('../models/Setting', () => ({
    Setting: { findByPk: jest.fn(async () => ({ value: 'direct' })) },
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
const mockedCouponFindOne = Coupon.findOne as jest.Mock;

const producto = {
    cod_producto: 1132,
    name: 'Producto QA',
    price: 100.0,
    stock: 9,
};

/** Cupon con la misma logica del modelo real (isValid / calculateDiscount). */
const cuponReal = (over: Record<string, any> = {}) => ({
    id: 1,
    code: 'BIENVENIDO10',
    type: 'percentage',
    value: 10,
    is_active: true,
    current_uses: 0,
    max_uses: null,
    min_purchase: null,
    valid_from: null,
    valid_until: null,
    isValid(amount: number) {
        if (!this.is_active) return { valid: false, message: 'Cupón inactivo' };
        if (this.max_uses && this.current_uses >= this.max_uses) {
            return { valid: false, message: 'Cupón agotado' };
        }
        if (this.min_purchase && amount < this.min_purchase) {
            return { valid: false, message: 'Compra mínima no alcanzada' };
        }
        return { valid: true };
    },
    calculateDiscount(amount: number) {
        return this.type === 'percentage' ? (amount * this.value) / 100 : Math.min(this.value, amount);
    },
    increment: jest.fn(async () => undefined),
    ...over,
});

describe('Cupones: el descuento lo calcula el servidor', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.post('/api/orders', createOrder);
    });

    beforeEach(() => {
        mockedFindAll.mockReset();
        mockedCreate.mockReset();
        mockedCouponFindOne.mockReset();
        mockedFindAll.mockResolvedValue([{ ...producto }]);
        mockedCreate.mockResolvedValue({ id: 1, tracking_code: 'PI-ABC234-DEF567' });
    });

    const pedidoBase = {
        customer_name: 'Cliente Prueba',
        customer_email: 'cliente@prueba.test',
        customer_phone: '999999999',
        items: [{ product_id: 1132, quantity: 2 }],
    };

    it('aplica el cupon y guarda el descuento en el pedido', async () => {
        const cupon = cuponReal();
        mockedCouponFindOne.mockResolvedValue(cupon);

        const response = await request(app)
            .post('/api/orders')
            .send({ ...pedidoBase, coupon_code: 'BIENVENIDO10' });

        expect(response.status).toBe(201);
        const valores = mockedCreate.mock.calls[0][0];
        // Total del catalogo: 100 x 2 = 200; cupon 10% -> 20 de descuento
        expect(valores.total_amount).toBe(180);
        expect(valores.discount_amount).toBe(20);
        expect(valores.coupon_code).toBe('BIENVENIDO10');
        expect(cupon.increment).toHaveBeenCalledWith('current_uses', expect.anything());
    });

    it('ignora el descuento que manda el cliente', async () => {
        mockedCouponFindOne.mockResolvedValue(cuponReal());

        const response = await request(app).post('/api/orders').send({
            ...pedidoBase,
            coupon_code: 'BIENVENIDO10',
            discount_amount: 999,
            total_amount: 1,
        });

        expect(response.status).toBe(201);
        const valores = mockedCreate.mock.calls[0][0];
        expect(valores.total_amount).toBe(180);
        expect(valores.discount_amount).toBe(20);
    });

    it('rechaza el pedido si el cupon no existe', async () => {
        mockedCouponFindOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/orders')
            .send({ ...pedidoBase, coupon_code: 'NOEXISTE' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_COUPON');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('rechaza el pedido si el cupon esta agotado', async () => {
        mockedCouponFindOne.mockResolvedValue(cuponReal({ current_uses: 5, max_uses: 5 }));

        const response = await request(app)
            .post('/api/orders')
            .send({ ...pedidoBase, coupon_code: 'BIENVENIDO10' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_COUPON');
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it('sin cupon el total es el del catalogo', async () => {
        const response = await request(app).post('/api/orders').send(pedidoBase);

        expect(response.status).toBe(201);
        const valores = mockedCreate.mock.calls[0][0];
        expect(valores.total_amount).toBe(200);
        expect(valores.discount_amount).toBe(0);
        expect(valores.coupon_code).toBeNull();
        expect(mockedCouponFindOne).not.toHaveBeenCalled();
    });
});
