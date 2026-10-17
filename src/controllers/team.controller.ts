import { Request, Response } from "express";
import * as teamService from "../services/team.service";
import type {
  PlayerInput,
  ReviewTeamInput,
  UpdateTeamInput,
} from "../validators/team.validator";
export const getMyTeam = async (req: Request, res: Response) =>
  res.json(await teamService.getOwnTeam(req.user!.sub));
export const updateMyTeam = async (req: Request, res: Response) =>
  res.json(
    await teamService.updateOwnTeam(req.user!.sub, req.body as UpdateTeamInput),
  );
export const listMyPlayers = async (req: Request, res: Response) =>
  res.json(await teamService.listOwnPlayers(req.user!.sub));
export const addMyPlayer = async (req: Request, res: Response) =>
  res
    .status(201)
    .json(
      await teamService.addOwnPlayer(req.user!.sub, req.body as PlayerInput),
    );
export const removeMyPlayer = async (req: Request, res: Response) => {
  await teamService.removeOwnPlayer(req.user!.sub, req.params.id as string);
  res.status(204).end();
};
export const listPendingTeams = async (_req: Request, res: Response) =>
  res.json(await teamService.listPendingTeams());
export const reviewTeam = async (req: Request, res: Response) =>
  res.json(
    await teamService.reviewTeam(
      req.params.id as string,
      req.body as ReviewTeamInput,
    ),
  );
