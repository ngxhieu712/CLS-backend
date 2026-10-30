import { PlayerModel } from "../models/player.model";
import "../models/group.model";
import { TeamModel } from "../models/team.model";
import { TournamentModel } from '../models/tournament.model';
import { UserModel } from "../models/user.model";
import { sendTeamReviewEmail } from './email.service';
import { badRequest, conflict, notFound } from "../utils/app-error";
import type {
  PlayerInput,
  ReviewTeamInput,
  UpdatePlayerInput,
  UpdateTeamInput,
} from "../validators/team.validator";

const ownTeam = async (managerId: string) => {
  const team = await TeamModel.findOne({ manager: managerId });
  if (!team) throw notFound("Team not found");
  return team;
};

const ensureRosterUnlocked = async (team: { tournament: unknown }) => {
  const tournament = await TournamentModel.findById(team.tournament).select('status');
  if (!tournament) throw notFound('Tournament not found');
  if (tournament.status !== 'draft' && tournament.status !== 'registration')
    throw badRequest('Roster changes are locked after the group stage starts');
};
export const getOwnTeam = (managerId: string) =>
  TeamModel.findOne({ manager: managerId }).populate("group", "name");
export const updateOwnTeam = async (
  managerId: string,
  input: UpdateTeamInput,
) => {
  const team = await ownTeam(managerId);
  if (team.profileStatus === 'approved' && (input.name !== undefined || input.tag !== undefined))
    throw badRequest('Approved teams cannot change their name or tag');
  if (input.name || input.tag) {
    const duplicate = await TeamModel.exists({
      _id: { $ne: team._id },
      $or: [
        { ...(input.name ? { name: input.name } : {}) },
        { ...(input.tag ? { tag: input.tag } : {}) },
      ],
    });
    if (duplicate) throw conflict("Team name or tag already exists");
  }
  Object.assign(team, input);
  return team.save();
};
export const listOwnPlayers = async (managerId: string) =>
  PlayerModel.find({ team: (await ownTeam(managerId))._id }).sort({
    createdAt: 1,
  });
export const addOwnPlayer = async (managerId: string, input: PlayerInput) =>
  {
    const team = await ownTeam(managerId);
    await ensureRosterUnlocked(team);
    const [total, starters] = await Promise.all([
      PlayerModel.countDocuments({ team: team._id }),
      input.status === 'starter' ? PlayerModel.countDocuments({ team: team._id, status: 'starter' }) : 0,
    ]);
    if (total >= 20) throw badRequest('A team can have at most 20 players');
    if (input.status === 'starter' && starters >= 5) throw badRequest('A team can have at most 5 starters');
    return PlayerModel.create({ ...input, team: team._id });
  };

export const updateOwnPlayer = async (managerId: string, playerId: string, input: UpdatePlayerInput) => {
  const team = await ownTeam(managerId);
  await ensureRosterUnlocked(team);
  const player = await PlayerModel.findOne({ _id: playerId, team: team._id });
  if (!player) throw notFound('Player not found');
  if (input.status === 'starter' && player.status !== 'starter') {
    const starters = await PlayerModel.countDocuments({ team: team._id, status: 'starter' });
    if (starters >= 5) throw badRequest('A team can have at most 5 starters');
  }
  Object.assign(player, input);
  return player.save();
};
export const removeOwnPlayer = async (managerId: string, playerId: string) => {
  const team = await ownTeam(managerId);
  await ensureRosterUnlocked(team);
  const deleted = await PlayerModel.findOneAndDelete({
    _id: playerId,
    team: team._id,
  });
  if (!deleted) throw notFound("Player not found");
};
export const listPendingTeams = () =>
  TeamModel.find({ profileStatus: "pending" })
    .populate("manager", "fullName email status")
    .sort({ registeredAt: 1 });
export const reviewTeam = async (teamId: string, input: ReviewTeamInput) => {
  const team = await TeamModel.findById(teamId);
  if (!team) throw notFound("Team not found");
  const approved = input.action === "approve";
  team.profileStatus = approved ? "approved" : "rejected";
  team.rejectReason = approved ? "" : input.reason!;
  await team.save();
  await UserModel.findByIdAndUpdate(team.manager, {
    status: approved ? "active" : "rejected",
  });
  const manager = await UserModel.findById(team.manager).select('email');
  if (manager) await sendTeamReviewEmail(manager.email, approved, input.reason);
  return team;
};
