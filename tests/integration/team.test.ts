import { describe, expect, it } from 'vitest';
import { PlayerModel } from '../../src/models/player.model';
import { TeamModel } from '../../src/models/team.model';
import { api } from '../helpers/api';
import { createTournament } from '../helpers/tournament-factory';
import { authCookieFor, createUser } from '../helpers/user-factory';

const createManagedTeam = async () => {
  const manager = await createUser({ email: 'manager@example.com' });
  const tournament = await createTournament();
  const team = await TeamModel.create({
    name: 'Team One', tag: 'ONE', contactEmail: 'team@example.com', contactPhone: '0123456789', manager: manager._id, tournament: tournament._id
  });
  return { manager, team, cookie: authCookieFor(manager) };
};

describe('/api/teams/me', () => {
  it('returns and updates the signed-in manager team', async () => {
    const { team, cookie } = await createManagedTeam();
    expect((await api().get('/api/teams/me').set('Cookie', cookie)).body).toMatchObject({ _id: String(team._id), name: 'Team One' });

    const updated = await api().patch('/api/teams/me').set('Cookie', cookie).send({ tag: 'two', description: 'Ready to play' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ tag: 'TWO', description: 'Ready to play' });
  });

  it('requires a team manager with a team', async () => {
    const referee = await createUser({ email: 'ref@example.com', role: 'referee' });
    expect((await api().get('/api/teams/me').set('Cookie', authCookieFor(referee))).status).toBe(403);
    const manager = await createUser({ email: 'none@example.com' });
    expect((await api().get('/api/teams/me').set('Cookie', authCookieFor(manager))).status).toBe(200);
  });
});

describe('/api/teams/me/players', () => {
  it('adds, lists, and removes the manager players', async () => {
    const { team, cookie } = await createManagedTeam();
    const created = await api().post('/api/teams/me/players').set('Cookie', cookie).send({ nickname: 'Ace', fullName: 'Alice', status: 'starter' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ nickname: 'Ace', team: String(team._id) });
    expect((await api().get('/api/teams/me/players').set('Cookie', cookie)).body).toHaveLength(1);
    expect((await api().delete(`/api/teams/me/players/${created.body._id}`).set('Cookie', cookie)).status).toBe(204);
    expect(await PlayerModel.countDocuments()).toBe(0);
  });
});
