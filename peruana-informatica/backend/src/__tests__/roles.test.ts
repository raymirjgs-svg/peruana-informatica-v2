import request from 'supertest';
import express from 'express';

describe('Role & Permission API', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Mock roles endpoint
        app.get('/api/admin/roles', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Super Admin',
                        slug: 'super-admin',
                        description: 'Full system access',
                        is_default: false,
                        permissions: [
                            { id: 1, name: 'View Products', slug: 'view-products', module: 'products' },
                            { id: 2, name: 'Create Products', slug: 'create-products', module: 'products' }
                        ]
                    },
                    {
                        id: 2,
                        name: 'Editor',
                        slug: 'editor',
                        description: 'Content editor',
                        is_default: false,
                        permissions: [
                            { id: 1, name: 'View Products', slug: 'view-products', module: 'products' }
                        ]
                    }
                ]
            });
        });

        // Mock permissions endpoint
        app.get('/api/admin/permissions', (req, res) => {
            res.json({
                success: true,
                data: {
                    all: [
                        { id: 1, name: 'View Products', slug: 'view-products', module: 'products' },
                        { id: 2, name: 'Create Products', slug: 'create-products', module: 'products' },
                        { id: 3, name: 'View Orders', slug: 'view-orders', module: 'orders' }
                    ],
                    grouped: {
                        products: [
                            { id: 1, name: 'View Products', slug: 'view-products', module: 'products' },
                            { id: 2, name: 'Create Products', slug: 'create-products', module: 'products' }
                        ],
                        orders: [
                            { id: 3, name: 'View Orders', slug: 'view-orders', module: 'orders' }
                        ]
                    }
                }
            });
        });

        // Mock create role
        app.post('/api/admin/roles', (req, res) => {
            const { name, slug, description, permissions } = req.body;

            if (!name || !slug) {
                return res.status(400).json({ error: 'Name and slug are required' });
            }

            res.status(201).json({
                success: true,
                data: {
                    id: 3,
                    name,
                    slug,
                    description,
                    is_default: false
                },
                message: 'Role created successfully'
            });
        });
    });

    describe('GET /api/admin/roles', () => {
        it('should return list of roles', async () => {
            const response = await request(app)
                .get('/api/admin/roles')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should include permissions in role data', async () => {
            const response = await request(app)
                .get('/api/admin/roles')
                .expect(200);

            const superAdmin = response.body.data[0];
            expect(superAdmin).toHaveProperty('permissions');
            expect(Array.isArray(superAdmin.permissions)).toBe(true);
        });
    });

    describe('GET /api/admin/permissions', () => {
        it('should return all permissions', async () => {
            const response = await request(app)
                .get('/api/admin/permissions')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('all');
            expect(response.body.data).toHaveProperty('grouped');
        });

        it('should group permissions by module', async () => {
            const response = await request(app)
                .get('/api/admin/permissions')
                .expect(200);

            const { grouped } = response.body.data;
            expect(grouped).toHaveProperty('products');
            expect(grouped).toHaveProperty('orders');
            expect(Array.isArray(grouped.products)).toBe(true);
        });
    });

    describe('POST /api/admin/roles', () => {
        it('should create a new role successfully', async () => {
            const newRole = {
                name: 'Test Role',
                slug: 'test-role',
                description: 'Test role description',
                permissions: [1, 2]
            };

            const response = await request(app)
                .post('/api/admin/roles')
                .send(newRole)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(newRole.name);
            expect(response.body.data.slug).toBe(newRole.slug);
        });

        it('should return error when name is missing', async () => {
            const invalidRole = {
                slug: 'test-role'
            };

            const response = await request(app)
                .post('/api/admin/roles')
                .send(invalidRole)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should return error when slug is missing', async () => {
            const invalidRole = {
                name: 'Test Role'
            };

            const response = await request(app)
                .post('/api/admin/roles')
                .send(invalidRole)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});
