import { z } from 'zod';
import { PLAYER_STATUSES } from '../models/player.model';

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  tag: z.string().trim().min(2).max(10).transform((value) => value.toUpperCase()).optional(),
  logo: z.string().url().optional(),
  description: z.string().trim().max(1000).optional(),
  organization: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().min(7).max(20).optional()
}).refine((value) => Object.keys(value).length > 0, 'Send at least one team field');
export const playerSchema = z.object({ nickname: z.string().trim().min(1).max(50), fullName: z.string().trim().max(100).optional(), avatar: z.string().url().optional(), position: z.string().trim().max(50).optional(), inGameId: z.string().trim().max(100).optional(), status: z.enum(PLAYER_STATUSES).default('starter') });
export const updatePlayerSchema = playerSchema.partial().refine((value) => Object.keys(value).length > 0, 'Send at least one player field');
export const reviewTeamSchema = z.object({ action: z.enum(['approve', 'reject']), reason: z.string().trim().max(500).optional() });
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type PlayerInput = z.infer<typeof playerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type ReviewTeamInput = z.infer<typeof reviewTeamSchema>;
