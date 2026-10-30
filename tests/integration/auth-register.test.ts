import { describe, expect, it } from 'vitest';
import { OtpModel } from '../../src/models/otp.model';
import { TeamModel } from '../../src/models/team.model';
import { UserModel } from '../../src/models/user.model';
import { api } from '../helpers/api';
import { otpFromLastEmail } from '../helpers/email-outbox';
import { createTournament } from '../helpers/tournament-factory';
import { createUser } from '../helpers/user-factory';

const validPayload = {
  fullName: 'New Manager',
  email: 'new@example.com',
  password: 'Passw0rd!',
  team: { name: 'New Team', tag: 'NEW', contactEmail: 'team@example.com', contactPhone: '0123456789' }
};

describe('POST /api/auth/register', () => {
  it('stores a pending registration OTP and emails it without creating the account yet', async () => {
    const response = await api().post('/api/auth/register').send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'OTP has been sent to your email' });
    expect(await UserModel.exists({ email: validPayload.email })).toBeNull();
    const otp = await OtpModel.findOne({ email: validPayload.email, purpose: 'register' });
    expect(otp?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(otp?.codeHash).not.toMatch(/^\d{6}$/);
    expect(otpFromLastEmail(validPayload.email)).toMatch(/^\d{6}$/);
  });

  it('rejects duplicate account emails and team names', async () => {
    await createUser({ email: validPayload.email });
    expect((await api().post('/api/auth/register').send(validPayload)).status).toBe(409);

    const teamPayload = { ...validPayload, email: 'manager@example.com' };
    await createTournament();
    await api().post('/api/auth/register').send(teamPayload);
    const code = otpFromLastEmail(teamPayload.email);
    await api().post('/api/auth/register/verify-otp').send({ email: teamPayload.email, otp: code });

    const duplicateTeam = { ...validPayload, email: 'other@example.com' };
    expect((await api().post('/api/auth/register').send(duplicateTeam)).status).toBe(409);
  });

  it('rejects invalid nested registration data before writing an OTP', async () => {
    const response = await api().post('/api/auth/register').send({ ...validPayload, team: { name: 'x' } });
    expect(response.status).toBe(400);
    expect(await OtpModel.countDocuments()).toBe(0);
  });
});

describe('POST /api/auth/register/verify-otp', () => {
  const beginRegistration = async () => {
    await api().post('/api/auth/register').send(validPayload);
    return otpFromLastEmail(validPayload.email);
  };

  it('creates a pending team manager and team after a valid OTP', async () => {
    await createTournament();
    const otp = await beginRegistration();

    const response = await api().post('/api/auth/register/verify-otp').send({ email: validPayload.email, otp });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Team profile submitted for approval' });
    const user = await UserModel.findOne({ email: validPayload.email });
    expect(user).toMatchObject({ fullName: 'New Manager', role: 'teamManager', status: 'pending' });
    expect(await TeamModel.findOne({ manager: user!._id })).toMatchObject({ name: 'New Team', tag: 'NEW', profileStatus: 'pending' });
    expect(await OtpModel.exists({ email: validPayload.email, purpose: 'register' })).toBeNull();
  });

  it('rejects a wrong or expired OTP without creating an account', async () => {
    await createTournament();
    const otp = await beginRegistration();
    expect((await api().post('/api/auth/register/verify-otp').send({ email: validPayload.email, otp: '000000' })).status).toBe(400);
    await OtpModel.updateOne({ email: validPayload.email, purpose: 'register' }, { expiresAt: new Date(Date.now() - 1) });
    expect((await api().post('/api/auth/register/verify-otp').send({ email: validPayload.email, otp })).status).toBe(400);
    expect(await UserModel.exists({ email: validPayload.email })).toBeNull();
  });

  it('requires a configured tournament before completing the registration', async () => {
    const otp = await beginRegistration();
    const response = await api().post('/api/auth/register/verify-otp').send({ email: validPayload.email, otp });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Tournament has not been configured yet');
  });
});
