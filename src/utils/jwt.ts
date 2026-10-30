import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  /** Set by `requireRole` after it reads the role from the database. */
  role?: string;
}

export interface GoogleRegistrationTicketPayload {
  purpose: 'google-registration';
  googleId: string;
  email: string;
  fullName: string;
}

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });

export const verifyToken = (token: string) => jwt.verify(token, env.jwtSecret) as JwtPayload;

export const signGoogleRegistrationTicket = (payload: Omit<GoogleRegistrationTicketPayload, 'purpose'>) =>
  jwt.sign({ ...payload, purpose: 'google-registration' }, env.jwtSecret, { expiresIn: '15m' });

export const verifyGoogleRegistrationTicket = (ticket: string) => {
  const payload = jwt.verify(ticket, env.jwtSecret) as GoogleRegistrationTicketPayload;
  if (payload.purpose !== 'google-registration') throw new jwt.JsonWebTokenError('Invalid registration ticket');
  return payload;
};
