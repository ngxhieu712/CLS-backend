import { z } from 'zod';
import { TEAM_PROFILE_STATUSES } from '../models/team.model';
import { USER_ROLES, USER_STATUSES } from '../models/user.model';

export const adminTeamQuerySchema = z.object({
  status: z.enum(TEAM_PROFILE_STATUSES).optional(),
});

export const createAdminAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum([USER_ROLES[2], USER_ROLES[3]]),
});

export const updateAccountStatusSchema = z.object({
  status: z.enum([USER_STATUSES[1], USER_STATUSES[2]]),
});

export type AdminTeamQuery = z.infer<typeof adminTeamQuerySchema>;
export type CreateAdminAccountInput = z.infer<typeof createAdminAccountSchema>;
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;
