import { PlayerModel } from "../models/player.model";
import { TeamModel } from "../models/team.model";
import { UserModel } from "../models/user.model";
import { conflict, notFound } from "../utils/app-error";
import type {
  PlayerInput,
  ReviewTeamInput,
  UpdateTeamInput,
} from "../validators/team.validator";

const ownTeam = async (managerId: string) => {
  const team = await TeamModel.findOne({ manager: managerId });
  if (!team) throw notFound("Team not found");
  return team;
};
export const getOwnTeam = (managerId: string) =>
  TeamModel.findOne({ manager: managerId }).populate("group", "name");
export const updateOwnTeam = async (
  managerId: string,
  input: UpdateTeamInput,
) => {
  const team = await ownTeam(managerId);
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
  PlayerModel.create({ ...input, team: (await ownTeam(managerId))._id });
export const removeOwnPlayer = async (managerId: string, playerId: string) => {
  const deleted = await PlayerModel.findOneAndDelete({
    _id: playerId,
    team: (await ownTeam(managerId))._id,
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
  return team;
};
