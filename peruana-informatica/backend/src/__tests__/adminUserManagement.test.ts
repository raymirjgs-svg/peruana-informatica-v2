import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = 'test-secret-key-for-admin-users';

jest.mock('../models/User', () => ({
  User: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { User } = require('../models/User');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const userRoutes = require('../routes/admin/userRoutes').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const adminAuthRoutes = require('../routes/admin/authRoutes').default;

const adminToken = jwt.sign(
  { id: 1, email: 'admin@pruanadeinformatica.com', role: 'admin' },
  process.env.JWT_SECRET
);

describe('Gestión de usuarios del staff (admin)', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin/users', authenticateToken, requireAdmin, userRoutes);
    app.use('/api/admin', authenticateToken, requireAdmin, adminAuthRoutes);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lista el staff sin exponer el hash de contraseña', async () => {
    (User.findAndCountAll as jest.Mock).mockResolvedValue({ count: 1, rows: [{ id: 1, email: 'a@b.test' }] });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].password_hash).toBeUndefined();

    const options = (User.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(options.attributes.exclude).toContain('password_hash');
    expect(options.where.role).toBeDefined();
  });

  it('crea un usuario con la contraseña hasheada', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockImplementation(async (data: any) => ({ id: 7, ...data }));

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'nuevo@prueba.test',
        password: 'secreto123',
        first_name: 'Nuevo',
        last_name: 'Admin',
        role: 'admin',
      })
      .expect(201);

    const created = (User.create as jest.Mock).mock.calls[0][0];
    expect(created.password_hash).not.toBe('secreto123');
    expect(await bcrypt.compare('secreto123', created.password_hash)).toBe(true);
    expect(res.body.data.email).toBe('nuevo@prueba.test');
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'corto@prueba.test',
        password: '123',
        first_name: 'Corto',
        last_name: 'Admin',
      })
      .expect(400);
  });

  it('impide que un admin se bloquee a sí mismo', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'admin@pruanadeinformatica.com',
      save: jest.fn(),
    });

    const res = await request(app)
      .put('/api/admin/users/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_blocked: true })
      .expect(400);

    expect(res.body.message).toMatch(/tu propia cuenta/i);
  });

  it('rechaza el cambio de contraseña con la contraseña actual incorrecta', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      auth_provider: 'local',
      password_hash: await bcrypt.hash('vieja1234', 10),
      save: jest.fn(),
    });

    await request(app)
      .patch('/api/admin/password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'incorrecta', newPassword: 'nueva12345' })
      .expect(401);
  });

  it('cambia la contraseña cuando la actual es correcta', async () => {
    const save = jest.fn();
    const user = {
      id: 1,
      auth_provider: 'local',
      password_hash: await bcrypt.hash('vieja1234', 10),
      save,
    };
    (User.findByPk as jest.Mock).mockResolvedValue(user);

    const res = await request(app)
      .patch('/api/admin/password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'vieja1234', newPassword: 'nueva12345' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(save).toHaveBeenCalled();
    expect(await bcrypt.compare('nueva12345', user.password_hash)).toBe(true);
  });
});
