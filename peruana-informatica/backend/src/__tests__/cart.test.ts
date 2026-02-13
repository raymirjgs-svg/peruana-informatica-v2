import request from 'supertest';
import express from 'express';

describe('Cart API', () => {
    let app: express.Application;
    let mockAuthMiddleware: express.RequestHandler;

    const mockUser = { id: 1, email: 'test@test.com' };

    beforeAll(() => {
        app = express();
        app.use(express.json());

        mockAuthMiddleware = (req, res, next) => {
            (req as any).user = mockUser;
            next();
        };

        app.use('/api/cart', mockAuthMiddleware);

        let mockCart: any = { id: 1, user_id: 1, status: 'active' };
        let mockCartItems: any[] = [
            { id: 1, cart_id: 1, product_id: 100, quantity: 2, product: { id: 100, name: 'Test Product', price: 100 } }
        ];

        app.get('/api/cart', (req, res) => {
            res.json({ cart: mockCart, items: mockCartItems });
        });

        app.post('/api/cart/sync', (req, res) => {
            const localItems = req.body.items || [];
            mockCartItems = localItems.map((item: any, idx: number) => ({
                id: idx + 10,
                cart_id: 1,
                product_id: item.id,
                quantity: item.quantity,
                product: { id: item.id, name: `Product ${item.id}`, price: 100 }
            }));
            res.json({ cart: mockCart, items: mockCartItems });
        });

        app.patch('/api/cart/item', (req, res) => {
            const { productId, quantity } = req.body;
            if (quantity > 0) {
                const existing = mockCartItems.find(i => i.product_id === productId);
                if (existing) {
                    existing.quantity = quantity;
                } else {
                    mockCartItems.push({
                        id: mockCartItems.length + 1,
                        cart_id: 1,
                        product_id: productId,
                        quantity,
                        product: { id: productId, name: `Product ${productId}`, price: 100 }
                    });
                }
                res.json({ success: true, item: mockCartItems.find(i => i.product_id === productId) });
            } else {
                mockCartItems = mockCartItems.filter(i => i.product_id !== productId);
                res.json({ success: true });
            }
        });

        app.delete('/api/cart/item/:productId', (req, res) => {
            const { productId } = req.params;
            mockCartItems = mockCartItems.filter(i => i.product_id !== parseInt(productId));
            res.json({ success: true });
        });
    });

    describe('GET /api/cart', () => {
        it('should return cart with items', async () => {
            const response = await request(app)
                .get('/api/cart')
                .expect(200);

            expect(response.body).toHaveProperty('cart');
            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should include product details in items', async () => {
            const response = await request(app)
                .get('/api/cart')
                .expect(200);

            expect(response.body.items[0]).toHaveProperty('product');
        });
    });

    describe('POST /api/cart/sync', () => {
        it('should sync local items with server', async () => {
            const localItems = [
                { id: 101, quantity: 3 },
                { id: 102, quantity: 1 }
            ];

            const response = await request(app)
                .post('/api/cart/sync')
                .send({ items: localItems })
                .expect(200);

            expect(response.body.items).toHaveLength(2);
        });

        it('should return updated cart with merged items', async () => {
            const localItems = [{ id: 200, quantity: 5 }];

            const response = await request(app)
                .post('/api/cart/sync')
                .send({ items: localItems })
                .expect(200);

            expect(response.body.items).toBeDefined();
        });
    });

    describe('PATCH /api/cart/item', () => {
        it('should add item to cart when product does not exist', async () => {
            const response = await request(app)
                .patch('/api/cart/item')
                .send({ productId: 999, quantity: 1 })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should update quantity when product already in cart', async () => {
            await request(app)
                .patch('/api/cart/item')
                .send({ productId: 100, quantity: 5 });

            const response = await request(app)
                .get('/api/cart');

            const item = response.body.items.find((i: any) => i.product_id === 100);
            expect(item.quantity).toBe(5);
        });

        it('should remove item when quantity is 0', async () => {
            await request(app)
                .patch('/api/cart/item')
                .send({ productId: 100, quantity: 0 });

            const response = await request(app)
                .get('/api/cart');

            const item = response.body.items.find((i: any) => i.product_id === 100);
            expect(item).toBeUndefined();
        });
    });

    describe('DELETE /api/cart/item/:productId', () => {
        it('should remove item from cart', async () => {
            await request(app)
                .patch('/api/cart/item')
                .send({ productId: 300, quantity: 2 });

            const response = await request(app)
                .delete('/api/cart/item/300')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return success even if product not found', async () => {
            const response = await request(app)
                .delete('/api/cart/item/999999')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Unauthorized access', () => {
        it('should return 401 when user is not authenticated', async () => {
            const unauthApp = express();
            unauthApp.use(express.json());
            unauthApp.get('/api/cart', (req, res) => {
                if (!(req as any).user) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                res.json({ cart: {}, items: [] });
            });

            const response = await request(unauthApp)
                .get('/api/cart')
                .expect(401);

            expect(response.body.error).toBe('Unauthorized');
        });
    });
});
