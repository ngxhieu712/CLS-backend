import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { AppError, unauthorized } from '../utils/app-error';

export interface VerifiedGoogleIdentity {
  googleId: string;
  email: string;
  fullName: string;
}

/** Verifies an ID token against this application's Google OAuth client. */
export const verifyGoogleIdToken = async (idToken: string): Promise<VerifiedGoogleIdentity> => {
  if (!env.googleClientId) throw new AppError(503, 'Google sign-in is not configured');

  const ticket = await new OAuth2Client(env.googleClientId).verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) throw unauthorized('Google email is not verified');

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    fullName: payload.name?.trim() || payload.email,
  };
};
