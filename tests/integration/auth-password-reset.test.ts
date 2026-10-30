import { describe, expect, it } from 'vitest';
import { OtpModel } from '../../src/models/otp.model';
import { UserModel } from '../../src/models/user.model';
import { comparePassword } from '../../src/utils/hash';
import { api } from '../helpers/api';
import { emailOutbox, otpFromLastEmail } from '../helpers/email-outbox';
import { createUser, DEFAULT_PASSWORD } from '../helpers/user-factory';

const email = 'user@example.com';
const newPassword = 'BrandNewPass1';

describe('POST /api/auth/forgot-password', () => {
  it('creates a reset OTP and emails it without exposing the code', async () => {
    await createUser({ email });
    const response = await api().post('/api/auth/forgot-password').send({ email });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'If the email exists, an OTP has been sent' });
    expect(otpFromLastEmail(email)).toMatch(/^\d{6}$/);
    expect(await OtpModel.exists({ email, purpose: 'resetPassword' })).not.toBeNull();
    expect(JSON.stringify(response.body)).not.toContain(otpFromLastEmail(email));
  });

  it('does not reveal whether an email exists', async () => {
    const response = await api().post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(response.status).toBe(200);
    expect(emailOutbox).toHaveLength(0);
  });
});

describe('POST /api/auth/reset-password', () => {
  const requestReset = async () => {
    await api().post('/api/auth/forgot-password').send({ email });
    return otpFromLastEmail(email);
  };

  it('updates the password and consumes the reset OTP', async () => {
    await createUser({ email });
    const otp = await requestReset();
    const response = await api().post('/api/auth/reset-password').send({ email, otp, newPassword });

    expect(response.status).toBe(200);
    const user = await UserModel.findOne({ email }).select('+password');
    await expect(comparePassword(newPassword, user!.password)).resolves.toBe(true);
    await expect(comparePassword(DEFAULT_PASSWORD, user!.password)).resolves.toBe(false);
    expect(await OtpModel.exists({ email, purpose: 'resetPassword' })).toBeNull();
  });

  it('allows login with the new password and rejects reuse or expiry', async () => {
    await createUser({ email });
    const otp = await requestReset();
    await api().post('/api/auth/reset-password').send({ email, otp, newPassword });
    expect((await api().post('/api/auth/login').send({ email, password: newPassword })).status).toBe(200);
    expect((await api().post('/api/auth/reset-password').send({ email, otp, newPassword })).status).toBe(400);

    await api().post('/api/auth/forgot-password').send({ email });
    const expiredOtp = otpFromLastEmail(email);
    await OtpModel.updateOne({ email, purpose: 'resetPassword' }, { expiresAt: new Date(Date.now() - 1) });
    expect((await api().post('/api/auth/reset-password').send({ email, otp: expiredOtp, newPassword })).status).toBe(400);
  });

  it('validates the OTP and new password shape', async () => {
    const response = await api().post('/api/auth/reset-password').send({ email, otp: '123', newPassword: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
});
