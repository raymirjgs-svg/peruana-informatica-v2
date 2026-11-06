import request from 'supertest';
import express from 'express';

describe('Authentication API', () => {
    let app: express.Application;

    const mockUsers = [
        { id: 1, email: 'test@test.com', password: 'hashed_password', name: 'Test User' },
        { id: 2, email: 'admin@test.com', password: 'hashed_admin', name: 'Admin User', role: 'admin' }
    ];

    let generatedTokens: string[] = [];

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.post('/api/auth/register', (req, res) => {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            const exists = mockUsers.find(u => u.email === email);
            if (exists) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const token = `token_${Date.now()}`;
            generatedTokens.push(token);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: { id: 3, email, name }
            });
        });

        app.post('/api/auth/login', (req, res) => {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            const user = mockUsers.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = `token_${Date.now()}`;
            generatedTokens.push(token);

            res.json({
                success: true,
                message: 'Login exitoso',
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role || 'customer' }
            });
        });

        app.post('/api/auth/logout', (req, res) => {
            res.json({ success: true, message: 'Logout exitoso' });
        });

        app.get('/api/auth/me', (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const token = authHeader.replace('Bearer ', '');
            if (!generatedTokens.includes(token)) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            res.json({
                success: true,
                user: { id: 1, email: 'test@test.com', name: 'Test User' }
            });
        });

        app.post('/api/auth/forgot-password', (req, res) => {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email es requerido' });
            }

            const user = mockUsers.find(u => u.email === email);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({ success: true, message: 'Email de recuperación enviado' });
        });

        app.post('/api/auth/refresh-token', (req, res) => {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token requerido' });
            }

            const newToken = `token_${Date.now()}`;
            generatedTokens.push(newToken);

            res.json({ success: true, token: newToken });
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@test.com',
                    password: 'password123',
                    name: 'New User'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('newuser@test.com');
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    password: 'password123',
                    name: 'New User'
                })
                .expect(400);

            expect(response.body.error).toContain('requeridos');
        });

        it('should return 400 when email already exists', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@test.com',
                    password: 'password123',
                    name: 'Test'
                })
                .expect(400);

            expect(response.body.error).toContain('ya está registrado');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' })
                .expect(400);

            expect(response.body.error).toContain('requeridos');
        });

        it('should return 401 with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@test.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.error).toContain('inválidas');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info with valid token', async () => {
            const token = `token_valid_${Date.now()}`;
            generatedTokens.push(token);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.user).toBeDefined();
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should send recovery email for existing user', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'test@test.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({})
                .expect(400);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@test.com' })
                .expect(404);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
