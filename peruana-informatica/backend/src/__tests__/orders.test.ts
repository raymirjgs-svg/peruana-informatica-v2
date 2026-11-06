import request from 'supertest';
import express from 'express';

describe('Order API', () => {
    let app: express.Application;

    const mockProducts: any[] = [
        { cod_producto: 1, name: 'Laptop Test', price: 1500 },
        { cod_producto: 2, name: 'Mouse Test', price: 50 }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.post('/api/orders', (req, res) => {
            const { customer_name, customer_email, items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'El carrito está vacío' });
            }

            if (!customer_name || !customer_email) {
                return res.status(400).json({ error: 'Nombre y email son requeridos' });
            }

            const processedItems = [];
            let totalAmount = 0;

            for (const item of items) {
                const product = mockProducts.find(p => p.cod_producto === item.product_id);
                if (!product) {
                    return res.status(404).json({ error: `Producto con ID ${item.product_id} no encontrado` });
                }
                const quantity = item.quantity || 1;
                totalAmount += product.price * quantity;
                processedItems.push({
                    product_id: product.cod_producto,
                    product_name: product.name,
                    price: product.price,
                    quantity
                });
            }

            const orderId = Math.floor(Math.random() * 10000);
            res.status(201).json({
                success: true,
                message: 'Pedido creado correctamente',
                order_id: orderId,
                status: 'pending',
                total_amount: totalAmount,
                items: processedItems
            });
        });
    });

    describe('POST /api/orders', () => {
        it('should create an order with valid data', async () => {
            const orderData = {
                customer_name: 'Juan Perez',
                customer_email: 'juan@test.com',
                customer_phone: '999999999',
                customer_document: '12345678',
                items: [
                    { product_id: 1, quantity: 2 },
                    { product_id: 2, quantity: 1 }
                ]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.order_id).toBeDefined();
            expect(response.body.total_amount).toBe(3050);
        });

        it('should return 400 when items array is empty', async () => {
            const orderData = {
                customer_name: 'Juan Perez',
                customer_email: 'juan@test.com',
                items: []
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(400);

            expect(response.body.error).toBe('El carrito está vacío');
        });

        it('should return 400 when customer_name is missing', async () => {
            const orderData = {
                customer_email: 'juan@test.com',
                items: [{ product_id: 1, quantity: 1 }]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(400);

            expect(response.body.error).toContain('requeridos');
        });

        it('should return 400 when customer_email is missing', async () => {
            const orderData = {
                customer_name: 'Juan Perez',
                items: [{ product_id: 1, quantity: 1 }]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(400);

            expect(response.body.error).toContain('requeridos');
        });

        it('should return 404 when product does not exist', async () => {
            const orderData = {
                customer_name: 'Juan Perez',
                customer_email: 'juan@test.com',
                items: [{ product_id: 999, quantity: 1 }]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(404);

            expect(response.body.error).toContain('no encontrado');
        });

        it('should calculate correct total amount', async () => {
            const orderData = {
                customer_name: 'Test User',
                customer_email: 'test@test.com',
                items: [
                    { product_id: 1, quantity: 3 }
                ]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(201);

            expect(response.body.total_amount).toBe(4500);
        });

        it('should default quantity to 1 if not provided', async () => {
            const orderData = {
                customer_name: 'Test User',
                customer_email: 'test@test.com',
                items: [
                    { product_id: 2 }
                ]
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(201);

            const mouseItem = response.body.items.find((i: any) => i.product_id === 2);
            expect(mouseItem.quantity).toBe(1);
            expect(response.body.total_amount).toBe(50);
        });
    });
});
