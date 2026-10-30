import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import type { CreateAdminAccountInput, UpdateAccountStatusInput } from '../validators/admin.validator';

export const listAccounts = async (_req: Request, res: Response) =>
  res.json(await adminService.listAccounts());

export const createAdminAccount = async (req: Request, res: Response) =>
  res.status(201).json(await adminService.createAccount(req.body as CreateAdminAccountInput));

export const changeAccountStatus = async (req: Request, res: Response) =>
  res.json(await adminService.updateAccountStatus(req.user!.sub, req.params.id as string, req.body as UpdateAccountStatusInput));
