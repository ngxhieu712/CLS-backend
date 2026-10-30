import { TeamModel, type TeamProfileStatus } from '../models/team.model';
import { UserModel } from '../models/user.model';
import { badRequest, conflict, notFound } from '../utils/app-error';
import type { CreateAdminAccountInput, UpdateAccountStatusInput } from '../validators/admin.validator';

export const listTeams = (status?: TeamProfileStatus) =>
  TeamModel.find(status ? { profileStatus: status } : {})
    .populate('manager', 'fullName email status')
    .sort({ registeredAt: -1 });

export const listAccounts = () =>
  UserModel.find({ role: { $in: ['referee', 'editor'] } })
    .select('fullName email role status createdAt updatedAt')
    .sort({ createdAt: -1 });

export const createAccount = async (input: CreateAdminAccountInput) => {
  if (await UserModel.exists({ email: input.email })) throw conflict('Email already exists');
  return UserModel.create({ ...input, status: 'active' });
};

export const updateAccountStatus = async (actorId: string, accountId: string, input: UpdateAccountStatusInput) => {
  if (actorId === accountId) throw badRequest('You cannot change your own account status');
  const account = await UserModel.findById(accountId);
  if (!account) throw notFound('Account not found');
  if (account.role === 'admin') throw badRequest('Admin accounts cannot be locked here');
  account.status = input.status;
  return account.save();
};
