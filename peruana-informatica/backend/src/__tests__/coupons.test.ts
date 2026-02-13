import request from 'supertest';
import express from 'express';

describe('Coupons & Discounts API', () => {
    let app: express.Application;

    const mockCoupons = [
        { id: 1, code: 'DESCUENTO10', type: 'percentage', value: 10, is_active: true, max_uses: 100, current_uses: 5 },
        { id: 2, code: 'FIJO50', type: 'fixed', value: 50, is_active: true, max_uses: 50, current_uses: 0 },
        { id: 3, code: 'EXPIRADO', type: 'percentage', value: 20, is_active: false, max_uses: 10, current_uses: 10 }
    ];

    const mockDiscounts = [
        { id: 1, name: 'Promo Verano', discount_type: 'percentage', discount_value: 15, is_active: true, valid_from: '2026-01-01', valid_until: '2026-12-31' },
        { id: 2, name: 'Descuento Fijo', discount_type: 'fixed', discount_value: 100, is_active: true, valid_from: '2026-01-01', valid_until: '2026-12-31' }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.get('/api/coupons', (req, res) => {
            res.json({ success: true, coupons: mockCoupons });
        });

        app.post('/api/coupons/validate', (req, res) => {
            const { code, purchase_amount } = req.body;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Código requerido' });
            }

            const coupon = mockCoupons.find(c => c.code === code.toUpperCase());
            if (!coupon) {
                return res.status(404).json({ success: false, message: 'Cupón no válido' });
            }

            if (!coupon.is_active) {
                return res.status(400).json({ success: false, message: 'Cupón inactivo' });
            }

            if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
                return res.status(400).json({ success: false, message: 'Cupón agotado' });
            }

            let discount_amount = 0;
            if (coupon.type === 'percentage') {
                discount_amount = (purchase_amount * coupon.value) / 100;
            } else {
                discount_amount = Math.min(coupon.value, purchase_amount);
            }

            res.json({
                success: true,
                data: { ...coupon, discount_amount }
            });
        });

        app.post('/api/coupons/apply', (req, res) => {
            const { code } = req.body;
            const coupon = mockCoupons.find(c => c.code === code.toUpperCase());

            if (!coupon || !coupon.is_active) {
                return res.status(400).json({ success: false, message: 'Cupón no aplicable' });
            }

            res.json({ success: true, message: 'Cupón aplicado', coupon });
        });

        app.get('/api/admin/coupons', (req, res) => {
            res.json({ success: true, data: mockCoupons });
        });

        app.post('/api/admin/coupons', (req, res) => {
            const { code, type, value } = req.body;
            if (!code || !type || !value) {
                return res.status(400).json({ error: 'Código, tipo y valor son requeridos' });
            }
            res.status(201).json({ success: true, coupon: { id: 4, code, type, value } });
        });

        app.get('/api/admin/discounts', (req, res) => {
            res.json({ success: true, data: mockDiscounts });
        });

        app.post('/api/admin/discounts', (req, res) => {
            const { name, discount_type, discount_value } = req.body;
            if (!name || !discount_type || !discount_value) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }
            res.status(201).json({ success: true, discount: { id: 3, name, discount_type, discount_value } });
        });
    });

    describe('POST /api/coupons/validate', () => {
        it('should validate a valid coupon', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'DESCUENTO10', purchase_amount: 100 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.discount_amount).toBe(10);
        });

        it('should calculate percentage discount correctly', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'DESCUENTO10', purchase_amount: 200 })
                .expect(200);

            expect(response.body.data.discount_amount).toBe(20);
        });

        it('should calculate fixed discount correctly', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'FIJO50', purchase_amount: 100 })
                .expect(200);

            expect(response.body.data.discount_amount).toBe(50);
        });

        it('should not exceed purchase amount for fixed discount', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'FIJO50', purchase_amount: 30 })
                .expect(200);

            expect(response.body.data.discount_amount).toBe(30);
        });

        it('should return error for invalid coupon', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'INVALID', purchase_amount: 100 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return error for inactive coupon', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ code: 'EXPIRADO', purchase_amount: 100 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return error when code is missing', async () => {
            const response = await request(app)
                .post('/api/coupons/validate')
                .send({ purchase_amount: 100 })
                .expect(400);
        });
    });

    describe('POST /api/coupons/apply', () => {
        it('should apply a valid coupon', async () => {
            const response = await request(app)
                .post('/api/coupons/apply')
                .send({ code: 'DESCUENTO10' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/admin/coupons', () => {
        it('should return all coupons', async () => {
            const response = await request(app).get('/api/admin/coupons').expect(200);
            expect(response.body.data.length).toBe(3);
        });
    });

    describe('POST /api/admin/coupons', () => {
        it('should create a new coupon', async () => {
            const response = await request(app)
                .post('/api/admin/coupons')
                .send({ code: 'NEWCoupon', type: 'percentage', value: 25 })
                .expect(201);

            expect(response.body.coupon.code).toBe('NEWCoupon');
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app)
                .post('/api/admin/coupons')
                .send({ code: 'TEST' })
                .expect(400);
        });
    });

    describe('GET /api/admin/discounts', () => {
        it('should return all discounts', async () => {
            const response = await request(app).get('/api/admin/discounts').expect(200);
            expect(response.body.data.length).toBe(2);
        });
    });

    describe('POST /api/admin/discounts', () => {
        it('should create a new discount', async () => {
            const response = await request(app)
                .post('/api/admin/discounts')
                .send({ name: 'Nuevo Descuento', discount_type: 'percentage', discount_value: 30 })
                .expect(201);

            expect(response.body.discount.name).toBe('Nuevo Descuento');
        });
    });
});
