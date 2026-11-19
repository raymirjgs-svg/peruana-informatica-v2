import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-key-for-admin-guard';

// Se carga despues de definir JWT_SECRET: el middleware lo lee al importarse.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

describe('Guardia de rutas admin', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.get('/api/admin/products', authenticateToken, requireAdmin, (_req, res) => {
      res.json({ success: true });
    });
  });

  it('rechaza peticiones sin token', async () => {
    await request(app).get('/api/admin/products').expect(401);
  });

  it('rechaza un token de cliente', async () => {
    const token = jwt.sign(
      { id: 99, email: 'cliente@prueba.test', role: 'customer' },
      process.env.JWT_SECRET
    );

    await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('rechaza un token invalido', async () => {
    await request(app)
      .get('/api/admin/products')
      .set('Authorization', 'Bearer token-invalido')
      .expect(403);
  });

  it('permite un token de administrador', async () => {
    const token = jwt.sign(
      { id: 1, email: 'admin@peruanadeinformatica.com.pe', role: 'admin' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
