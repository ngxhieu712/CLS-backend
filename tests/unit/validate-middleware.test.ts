import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateBody } from '../../src/middlewares/validate.middleware';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const run = (body: unknown) => {
  const req = { body } as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  validateBody(schema)(req, res, next);
  return { req, res, next };
};

describe('validateBody', () => {
  it('calls next() for a valid body', () => {
    const { res, next } = run({ email: 'a@b.com', age: 20 });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('replaces req.body with the parsed result and drops unknown keys', () => {
    const { req } = run({ email: 'a@b.com', age: 20, isAdmin: true });
    expect(req.body).toEqual({ email: 'a@b.com', age: 20 });
    expect(req.body).not.toHaveProperty('isAdmin');
  });

  it('answers 400 with a field-level error list', () => {
    const { res, next } = run({ email: 'nope', age: 10 });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);

    const payload = vi.mocked(res.json).mock.calls[0][0] as {
      message: string;
      errors: { field: string; message: string }[];
    };
    expect(payload.message).toBe('Validation failed');
    expect(payload.errors.map((error) => error.field).sort()).toEqual(['age', 'email']);
    expect(payload.errors.every((error) => typeof error.message === 'string')).toBe(true);
  });

  it('answers 400 for an empty or non-object body', () => {
    expect(vi.mocked(run({}).res.status)).toHaveBeenCalledWith(400);
    expect(vi.mocked(run(undefined).res.status)).toHaveBeenCalledWith(400);
    expect(vi.mocked(run('string-body').res.status)).toHaveBeenCalledWith(400);
  });
});
