import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
