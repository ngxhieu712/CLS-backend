import { TournamentModel } from '../../src/models/tournament.model';

/** 
 * Registration needs one tournament with status='registration'.
 * Create the minimum valid record for testing registration flows.
 */
export const createTournament = (overrides: Partial<{ name: string; status: string }> = {}) => 
  TournamentModel.create({ 
    name: 'Test Tournament',
    status: 'registration', // Required for registration flow tests
    ...overrides 
  });
