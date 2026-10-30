import { describe, expect, it } from 'vitest';
import { TeamModel } from '../../src/models/team.model';
import { UserModel } from '../../src/models/user.model';
import { api } from '../helpers/api';
import { createTournament } from '../helpers/tournament-factory';
import { authCookieFor, createUser } from '../helpers/user-factory';

const createTeam = async (overrides: Partial<{ name: string; tag: string; profileStatus: 'pending' | 'approved' | 'rejected' }> = {}) => {
  const tournament = await createTournament();
  const manager = await createUser({ email: `${overrides.tag ?? 'team'}@example.com`, status: 'pending' });
  return TeamModel.create({
    name: overrides.name ?? 'Team One', tag: overrides.tag ?? 'ONE', contactEmail: 'team@example.com', contactPhone: '0123456789',
    manager: manager._id, tournament: tournament._id, profileStatus: overrides.profileStatus ?? 'pending'
  });
};

const signInAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
  return authCookieFor(admin);
};

describe('admin team review', () => {
  it('requires an admin cookie', async () => {
    const user = await createUser();
    expect((await api().get('/api/admin/teams/pending')).status).toBe(401);
    expect((await api().get('/api/admin/teams/pending').set('Cookie', authCookieFor(user))).status).toBe(403);
  });

  it('lists pending teams with their public manager fields', async () => {
    const auth = await signInAdmin();
    await createTeam();
    await createTeam({ name: 'Approved Team', tag: 'APP', profileStatus: 'approved' });

    const response = await api().get('/api/admin/teams/pending').set('Cookie', auth);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: 'Team One', profileStatus: 'pending' });
    expect(response.body[0].manager).toMatchObject({ fullName: 'Test User', status: 'pending' });
    expect(response.body[0].manager).not.toHaveProperty('password');
  });

  it('approves or rejects a team and synchronizes the manager status', async () => {
    const auth = await signInAdmin();
    const team = await createTeam();

    const approved = await api().patch(`/api/admin/teams/${team._id}/review`).set('Cookie', auth).send({ action: 'approve' });
    expect(approved.status).toBe(200);
    expect(approved.body).toMatchObject({ profileStatus: 'approved', rejectReason: '' });
    expect((await UserModel.findById(team.manager))?.status).toBe('active');

    const second = await createTeam({ name: 'Second Team', tag: 'TWO' });
    const rejected = await api().patch(`/api/admin/teams/${second._id}/review`).set('Cookie', auth).send({ action: 'reject', reason: 'Missing roster' });
    expect(rejected.status).toBe(200);
    expect(rejected.body).toMatchObject({ profileStatus: 'rejected', rejectReason: 'Missing roster' });
    expect((await UserModel.findById(second.manager))?.status).toBe('rejected');
  });

  it('validates review action, rejection reason, and team id', async () => {
    const auth = await signInAdmin();
    const team = await createTeam();
    expect((await api().patch(`/api/admin/teams/${team._id}/review`).set('Cookie', auth).send({ action: 'reject' })).status).toBe(400);
    expect((await api().patch(`/api/admin/teams/${team._id}/review`).set('Cookie', auth).send({ action: 'other' })).status).toBe(400);
    expect((await api().patch('/api/admin/teams/not-an-id/review').set('Cookie', auth).send({ action: 'approve' })).status).toBe(400);
  });
});
