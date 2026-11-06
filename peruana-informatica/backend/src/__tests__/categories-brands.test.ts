import request from 'supertest';
import express from 'express';

describe('Categories & Brands API', () => {
    let app: express.Application;

    const mockCategories = [
        { id: 1, name: 'Laptops', slug: 'laptops', parent_id: null },
        { id: 2, name: 'Accesorios', slug: 'accesorios', parent_id: null },
        { id: 3, name: 'Mouses', slug: 'mouses', parent_id: 2 }
    ];

    const mockBrands = [
        { id: 1, name: 'HP', slug: 'hp' },
        { id: 2, name: 'Logitech', slug: 'logitech' },
        { id: 3, name: 'Dell', slug: 'dell' }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.get('/api/categories', (req, res) => {
            let categories = [...mockCategories];
            if (req.query.parent === 'true') {
                categories = categories.filter(c => c.parent_id === null);
            }
            res.json({ success: true, categories });
        });

        app.get('/api/categories/:slug', (req, res) => {
            const category = mockCategories.find(c => c.slug === req.params.slug);
            if (!category) {
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json({ success: true, category });
        });

        app.post('/api/admin/categories', (req, res) => {
            const { name, parent_id } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Nombre es requerido' });
            }
            const newCategory = {
                id: mockCategories.length + 1,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
                parent_id: parent_id || null
            };
            res.status(201).json({ success: true, category: newCategory });
        });

        app.put('/api/admin/categories/:id', (req, res) => {
            const category = mockCategories.find(c => c.id === Number(req.params.id));
            if (!category) {
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json({ success: true, category: { ...category, ...req.body } });
        });

        app.delete('/api/admin/categories/:id', (req, res) => {
            const category = mockCategories.find(c => c.id === Number(req.params.id));
            if (!category) {
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json({ success: true, message: 'Categoría eliminada' });
        });

        app.get('/api/brands', (req, res) => {
            res.json({ success: true, brands: mockBrands });
        });

        app.get('/api/brands/:slug', (req, res) => {
            const brand = mockBrands.find(b => b.slug === req.params.slug);
            if (!brand) {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            res.json({ success: true, brand });
        });

        app.post('/api/admin/brands', (req, res) => {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Nombre es requerido' });
            }
            const newBrand = {
                id: mockBrands.length + 1,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-')
            };
            res.status(201).json({ success: true, brand: newBrand });
        });

        app.put('/api/admin/brands/:id', (req, res) => {
            const brand = mockBrands.find(b => b.id === Number(req.params.id));
            if (!brand) {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            res.json({ success: true, brand: { ...brand, ...req.body } });
        });

        app.delete('/api/admin/brands/:id', (req, res) => {
            const brand = mockBrands.find(b => b.id === Number(req.params.id));
            if (!brand) {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            res.json({ success: true, message: 'Marca eliminada' });
        });
    });

    describe('GET /api/categories', () => {
        it('should return all categories', async () => {
            const response = await request(app).get('/api/categories').expect(200);
            expect(response.body.categories.length).toBe(3);
        });

        it('should filter parent categories', async () => {
            const response = await request(app).get('/api/categories?parent=true').expect(200);
            expect(response.body.categories.length).toBe(2);
        });
    });

    describe('GET /api/categories/:slug', () => {
        it('should return category by slug', async () => {
            const response = await request(app).get('/api/categories/laptops').expect(200);
            expect(response.body.category.name).toBe('Laptops');
        });

        it('should return 404 for non-existent category', async () => {
            const response = await request(app).get('/api/categories/not-exist').expect(404);
        });
    });

    describe('POST /api/admin/categories', () => {
        it('should create a new category', async () => {
            const response = await request(app)
                .post('/api/admin/categories')
                .send({ name: 'Nueva Categoría' })
                .expect(201);
            expect(response.body.category.name).toBe('Nueva Categoría');
        });

        it('should return 400 when name is missing', async () => {
            const response = await request(app)
                .post('/api/admin/categories')
                .send({})
                .expect(400);
        });
    });

    describe('GET /api/brands', () => {
        it('should return all brands', async () => {
            const response = await request(app).get('/api/brands').expect(200);
            expect(response.body.brands.length).toBe(3);
        });
    });

    describe('GET /api/brands/:slug', () => {
        it('should return brand by slug', async () => {
            const response = await request(app).get('/api/brands/hp').expect(200);
            expect(response.body.brand.name).toBe('HP');
        });
    });

    describe('POST /api/admin/brands', () => {
        it('should create a new brand', async () => {
            const response = await request(app)
                .post('/api/admin/brands')
                .send({ name: 'Nueva Marca' })
                .expect(201);
            expect(response.body.brand.name).toBe('Nueva Marca');
        });
    });

    describe('DELETE /api/admin/categories/:id', () => {
        it('should delete a category', async () => {
            const response = await request(app).delete('/api/admin/categories/1').expect(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('DELETE /api/admin/brands/:id', () => {
        it('should delete a brand', async () => {
            const response = await request(app).delete('/api/admin/brands/1').expect(200);
            expect(response.body.success).toBe(true);
        });
    });
});
