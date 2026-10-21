import type { NextFunction, Request, Response } from 'express';
import { CustomError, errorHandler, notFoundHandler } from '../../middleware/errorHandler';

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockReq = (overrides: Partial<Request> = {}) =>
  ({ url: '/api/test', method: 'GET', originalUrl: '/api/test', ...overrides } as Request);

const mockNext = () => jest.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('hides internal messages on 500 errors', () => {
    const res = mockRes();

    errorHandler(new Error('database exploded'), mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' }),
    );
  });

  it('keeps client error messages and status codes', () => {
    const res = mockRes();
    const err = new CustomError('Invalid coupon', 400, 'INVALID_COUPON');

    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid coupon', code: 'INVALID_COUPON' }),
    );
  });

  it('defaults CustomError to 500 and INTERNAL_ERROR', () => {
    const err = new CustomError('boom');

    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('CustomError');
  });

  it('exposes the stack only in development', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();

    errorHandler(new Error('boom'), mockReq(), res, mockNext());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stack: expect.any(String) }));
    process.env.NODE_ENV = original;
  });
});

describe('notFoundHandler', () => {
  it('forwards a 404 error to the error handler', () => {
    const next = jest.fn();

    notFoundHandler(mockReq({ originalUrl: '/missing' }), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
  });
});
