import { describe, expect, it } from 'vitest';
import { UserModel } from '../../src/models/user.model';
import { api } from '../helpers/api';
import { authCookieFor, createUser, DEFAULT_PASSWORD } from '../helpers/user-factory';

const email = 'user@example.com';
const credentials = { email, password: DEFAULT_PASSWORD };

describe('POST /api/auth/login', () => {
  it('sets an httpOnly auth cookie and returns public account data', async () => {
    await createUser({ email, fullName: 'Alice' });
    const response = await api().post('/api/auth/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']?.[0]).toContain('auth_token=');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.body).toEqual({ user: expect.objectContaining({ email, fullName: 'Alice', role: 'teamManager', status: 'active' }) });
    expect(JSON.stringify(response.body)).not.toContain(DEFAULT_PASSWORD);
  });

  it('rejects invalid credentials and locked accounts', async () => {
    expect((await api().post('/api/auth/login').send(credentials)).status).toBe(401);
    await createUser({ email, status: 'locked' });
    expect((await api().post('/api/auth/login').send(credentials)).status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('reads the signed-in account from the auth cookie without private fields', async () => {
    const user = await createUser({ email, fullName: 'Alice' });
    const response = await api().get('/api/auth/me').set('Cookie', authCookieFor(user));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ email, fullName: 'Alice', status: 'active' });
    expect(response.body).not.toHaveProperty('password');
  });

  it('rejects requests with no cookie or a deleted account', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    const user = await createUser({ email });
    await UserModel.deleteOne({ _id: user._id });
    expect((await api().get('/api/auth/me').set('Cookie', authCookieFor(user))).status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const user = await createUser({ email });
    const response = await api().post('/api/auth/logout').set('Cookie', authCookieFor(user));
    expect(response.status).toBe(204);
    expect(response.headers['set-cookie']?.[0]).toContain('auth_token=;');
  });
});
