import type { NextFunction, Request, Response } from 'express';
import { checkAnyPermission, checkPermission, checkRole } from '../../middleware/permissions';
import { User } from '../../models/User';
import { Role } from '../../models/Role';

jest.mock('../../models/User', () => ({ User: { findByPk: jest.fn() } }));
jest.mock('../../models/Role', () => ({ Role: { findOne: jest.fn() } }));
jest.mock('../../models/Permission', () => ({ Permission: {} }));
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const findByPk = User.findByPk as unknown as jest.Mock;
const findOne = Role.findOne as unknown as jest.Mock;

const buildRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const buildReq = (user?: { id: number }) => ({ user } as unknown as Request);

describe('checkPermission', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects unauthenticated requests with 401', async () => {
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:read')(buildReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unknown users with 404', async () => {
    findByPk.mockResolvedValue(null);
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:read')(buildReq({ id: 1 }), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows super-admins without checking permissions', async () => {
    findByPk.mockResolvedValue({ id: 1, role: 'super-admin' });
    findOne.mockResolvedValue({ slug: 'super-admin', permissions: [] });
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('anything')(buildReq({ id: 1 }), buildRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows users whose role has the permission', async () => {
    findByPk.mockResolvedValue({ id: 2, role: 'editor' });
    findOne.mockResolvedValue({ slug: 'editor', permissions: [{ slug: 'products:read' }] });
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:read')(buildReq({ id: 2 }), buildRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects users whose role lacks the permission with 403', async () => {
    findByPk.mockResolvedValue({ id: 3, role: 'viewer' });
    findOne.mockResolvedValue({ slug: 'viewer', permissions: [{ slug: 'products:read' }] });
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:delete')(buildReq({ id: 3 }), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects users without a role', async () => {
    findByPk.mockResolvedValue({ id: 4, role: null });
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:read')(buildReq({ id: 4 }), res, next);

    expect(findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 500 when the permission lookup fails', async () => {
    findByPk.mockRejectedValue(new Error('connection lost'));
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkPermission('products:read')(buildReq({ id: 5 }), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('checkAnyPermission', () => {
  afterEach(() => jest.clearAllMocks());

  it('allows when the role has at least one required permission', async () => {
    findByPk.mockResolvedValue({ id: 6, role: 'editor' });
    findOne.mockResolvedValue({ slug: 'editor', permissions: [{ slug: 'orders:update' }] });
    const next = jest.fn() as unknown as NextFunction;

    await checkAnyPermission(['products:read', 'orders:update'])(buildReq({ id: 6 }), buildRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects when the role has none of the required permissions', async () => {
    findByPk.mockResolvedValue({ id: 7, role: 'viewer' });
    findOne.mockResolvedValue({ slug: 'viewer', permissions: [{ slug: 'products:read' }] });
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkAnyPermission(['orders:update'])(buildReq({ id: 7 }), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('checkRole', () => {
  afterEach(() => jest.clearAllMocks());

  it('allows users with the required role', async () => {
    findByPk.mockResolvedValue({ id: 8, role: 'admin' });
    const next = jest.fn() as unknown as NextFunction;

    await checkRole('admin')(buildReq({ id: 8 }), buildRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects users with a different role', async () => {
    findByPk.mockResolvedValue({ id: 9, role: 'customer' });
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await checkRole('admin')(buildReq({ id: 9 }), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
