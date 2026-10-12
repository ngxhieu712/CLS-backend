import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../src/utils/jwt';

const payload = { sub: '507f1f77bcf86cd799439011', email: 'user@example.com' };

describe('jwt utils', () => {
  it('round-trips the payload', () => {
    const decoded = verifyToken(signToken(payload));
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
  });

  it('rejects a token signed with another secret', () => {
    const foreignToken = jwt.sign(payload, 'not_the_app_secret');
    expect(() => verifyToken(foreignToken)).toThrow();
  });

  it('rejects a tampered token', () => {
    const token = signToken(payload);
    const tampered = `${token.slice(0, -2)}xy`;
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '-1s' });
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  it('rejects garbage input', () => {
    expect(() => verifyToken('')).toThrow();
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
