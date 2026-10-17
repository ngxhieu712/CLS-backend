import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === 'auth_token')?.[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.user = verifyToken(decodeURIComponent(token));
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
