import request from 'supertest';
import express from 'express';

describe('Products API', () => {
    let app: express.Application;

    const mockProducts = [
        { cod_producto: 1, name: 'Laptop HP', slug: 'laptop-hp', price: 1500, stock: 10, category_id: 1, brand_id: 1 },
        { cod_producto: 2, name: 'Mouse Logitech', slug: 'mouse-logitech', price: 50, stock: 50, category_id: 2, brand_id: 2 },
        { cod_producto: 3, name: 'Teclado Mecánico', slug: 'teclado-mecanico', price: 120, stock: 0, category_id: 2, brand_id: 2 }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.get('/api/products', (req, res) => {
            let products = [...mockProducts];
            const { search, category, brand, minPrice, maxPrice, inStock } = req.query;

            if (search) {
                products = products.filter(p => 
                    p.name.toLowerCase().includes(String(search).toLowerCase())
                );
            }

            if (category) {
                products = products.filter(p => p.category_id === Number(category));
            }

            if (brand) {
                products = products.filter(p => p.brand_id === Number(brand));
            }

            if (inStock === 'true') {
                products = products.filter(p => p.stock > 0);
            }

            res.json({
                success: true,
                products,
                total: products.length,
                page: 1,
                totalPages: 1
            });
        });

        app.get('/api/products/:id', (req, res) => {
            const product = mockProducts.find(p => p.cod_producto === Number(req.params.id));
            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ success: true, product });
        });

        app.get('/api/products/slug/:slug', (req, res) => {
            const product = mockProducts.find(p => p.slug === req.params.slug);
            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ success: true, product });
        });

        app.post('/api/admin/products', (req, res) => {
            const { name, price, stock, category_id, brand_id } = req.body;

            if (!name || !price) {
                return res.status(400).json({ error: 'Nombre y precio son requeridos' });
            }

            const newProduct = {
                cod_producto: mockProducts.length + 1,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
                price,
                stock: stock || 0,
                category_id: category_id || null,
                brand_id: brand_id || null
            };

            res.status(201).json({ success: true, product: newProduct });
        });

        app.put('/api/admin/products/:id', (req, res) => {
            const product = mockProducts.find(p => p.cod_producto === Number(req.params.id));
            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            const updated = { ...product, ...req.body };
            res.json({ success: true, product: updated });
        });

        app.delete('/api/admin/products/:id', (req, res) => {
            const product = mockProducts.find(p => p.cod_producto === Number(req.params.id));
            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ success: true, message: 'Producto eliminado' });
        });
    });

    describe('GET /api/products', () => {
        it('should return list of products', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.products)).toBe(true);
        });

        it('should filter products by search', async () => {
            const response = await request(app)
                .get('/api/products?search=laptop')
                .expect(200);

            expect(response.body.products.length).toBe(1);
            expect(response.body.products[0].name).toContain('Laptop');
        });

        it('should filter products in stock', async () => {
            const response = await request(app)
                .get('/api/products?inStock=true')
                .expect(200);

            expect(response.body.products.length).toBe(2);
            expect(response.body.products.every((p: any) => p.stock > 0)).toBe(true);
        });

        it('should return pagination info', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('totalPages');
        });
    });

    describe('GET /api/products/:id', () => {
        it('should return product by id', async () => {
            const response = await request(app)
                .get('/api/products/1')
                .expect(200);

            expect(response.body.product.cod_producto).toBe(1);
        });

        it('should return 404 for non-existent product', async () => {
            const response = await request(app)
                .get('/api/products/999')
                .expect(404);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/products/slug/:slug', () => {
        it('should return product by slug', async () => {
            const response = await request(app)
                .get('/api/products/slug/laptop-hp')
                .expect(200);

            expect(response.body.product.slug).toBe('laptop-hp');
        });
    });

    describe('POST /api/admin/products', () => {
        it('should create a new product', async () => {
            const newProduct = {
                name: 'Nuevo Producto',
                price: 100,
                stock: 5,
                category_id: 1,
                brand_id: 1
            };

            const response = await request(app)
                .post('/api/admin/products')
                .send(newProduct)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.product.name).toBe('Nuevo Producto');
        });

        it('should return 400 when name is missing', async () => {
            const response = await request(app)
                .post('/api/admin/products')
                .send({ price: 100 })
                .expect(400);

            expect(response.body.error).toContain('requeridos');
        });
    });

    describe('PUT /api/admin/products/:id', () => {
        it('should update a product', async () => {
            const response = await request(app)
                .put('/api/admin/products/1')
                .send({ price: 2000 })
                .expect(200);

            expect(response.body.product.price).toBe(2000);
        });

        it('should return 404 for non-existent product', async () => {
            const response = await request(app)
                .put('/api/admin/products/999')
                .send({ price: 100 })
                .expect(404);
        });
    });

    describe('DELETE /api/admin/products/:id', () => {
        it('should delete a product', async () => {
            const response = await request(app)
                .delete('/api/admin/products/1')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent product', async () => {
            const response = await request(app)
                .delete('/api/admin/products/999')
                .expect(404);
        });
    });
});
