import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { authGuard } from '../../src/middlewares/auth.middleware';
import { signToken } from '../../src/utils/jwt';

const buildContext = (cookie?: string) => {
  const req = { headers: cookie ? { cookie } : {} } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
};

const expectUnauthorized = (res: Response, next: NextFunction) => {
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  expect(next).not.toHaveBeenCalled();
};

describe('authGuard', () => {
  it('passes a valid auth_token cookie through and exposes the payload', () => {
    const token = signToken({ sub: 'user-id', email: 'user@example.com' });
    const { req, res, next } = buildContext(`auth_token=${encodeURIComponent(token)}`);

    authGuard(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ sub: 'user-id', email: 'user@example.com' });
  });

  it('rejects a request with no auth cookie', () => {
    const { req, res, next } = buildContext();
    authGuard(req, res, next);
    expectUnauthorized(res, next);
  });

  it.each(['session=abc', 'auth_token=not-a-jwt', 'auth_token=abc.def.ghi'])(
    'rejects malformed cookie %j',
    (cookie) => {
      const { req, res, next } = buildContext(cookie);
      authGuard(req, res, next);
      expectUnauthorized(res, next);
    }
  );

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: 'user-id', email: 'user@example.com' }, process.env.JWT_SECRET as string, {
      expiresIn: '-1s'
    });
    const { req, res, next } = buildContext(`auth_token=${expired}`);

    authGuard(req, res, next);

    expectUnauthorized(res, next);
  });

  it('rejects a token signed with a foreign secret', () => {
    const foreign = jwt.sign({ sub: 'user-id', email: 'user@example.com' }, 'foreign_secret');
    const { req, res, next } = buildContext(`auth_token=${foreign}`);

    authGuard(req, res, next);

    expectUnauthorized(res, next);
  });
});
