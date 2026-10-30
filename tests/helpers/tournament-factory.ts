import { TournamentModel } from '../../src/models/tournament.model';

/** Registration needs one tournament; create the minimum valid record. */
export const createTournament = (name = 'Test Tournament') => TournamentModel.create({ name });
