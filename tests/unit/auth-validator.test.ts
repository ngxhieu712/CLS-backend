import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, loginSchema, otpSchema, registerSchema, resetPasswordSchema, resubmitSchema } from '../../src/validators/auth.validator';

const team = { name: 'Team One', tag: 'ONE', contactEmail: 'team@example.com', contactPhone: '0123456789' };

describe('auth validators', () => {
  it('accepts the nested team registration payload and normalizes its tag', () => {
    const result = registerSchema.safeParse({ fullName: 'Alice', email: 'a@b.com', password: 'secret12', team: { ...team, tag: 'one' } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.team.tag).toBe('ONE');
  });

  it('requires account fields and the required team fields', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: 'secret12' }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: 'A', email: 'bad', password: 'short', team: { name: 'x' } }).success).toBe(false);
  });

  it('validates login, OTP and reset payloads', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(otpSchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
    expect(otpSchema.safeParse({ email: 'a@b.com', otp: '12345a' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ email: 'a@b.com', otp: '123456', newPassword: 'new-password' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ email: 'a@b.com', otp: '123456', newPassword: 'short' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });

  it('requires at least one valid field when resubmitting a team profile', () => {
    expect(resubmitSchema.safeParse({}).success).toBe(false);
    expect(resubmitSchema.safeParse({ contactPhone: '0123456789' }).success).toBe(true);
  });
});
