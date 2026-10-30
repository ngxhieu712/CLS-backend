import { describe, expect, it } from 'vitest';
import { TeamModel } from '../../src/models/team.model';
import { api } from '../helpers/api';
import { createTournament } from '../helpers/tournament-factory';
import { authCookieFor, createUser } from '../helpers/user-factory';

const createRejectedTeamManager = async () => {
  const manager = await createUser({ email: 'manager@example.com', status: 'rejected' });
  const tournament = await createTournament();
  const team = await TeamModel.create({
    name: 'Rejected Team', tag: 'REJ', contactEmail: 'team@example.com', contactPhone: '0123456789',
    manager: manager._id, tournament: tournament._id, profileStatus: 'rejected', rejectReason: 'Incomplete details'
  });
  return { manager, team };
};

describe('PATCH /api/auth/resubmit', () => {
  it('resubmits a rejected team and returns both records to pending', async () => {
    const { manager, team } = await createRejectedTeamManager();
    const response = await api().patch('/api/auth/resubmit').set('Cookie', authCookieFor(manager)).send({ contactPhone: '0987654321' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ _id: String(team._id), contactPhone: '0987654321', profileStatus: 'pending', rejectReason: '' });
    expect((await TeamModel.findById(team._id))?.profileStatus).toBe('pending');
  });

  it('allows only rejected team managers and requires a change', async () => {
    const activeManager = await createUser({ email: 'active@example.com' });
    expect((await api().patch('/api/auth/resubmit').set('Cookie', authCookieFor(activeManager)).send({ contactPhone: '0987654321' })).status).toBe(400);
    const { manager } = await createRejectedTeamManager();
    expect((await api().patch('/api/auth/resubmit').set('Cookie', authCookieFor(manager)).send({})).status).toBe(400);
  });
});
