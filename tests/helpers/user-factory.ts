import { UserModel, UserRole, UserStatus } from '../../src/models/user.model';
import { hashPassword } from '../../src/utils/hash';
import { signToken } from '../../src/utils/jwt';

export const DEFAULT_PASSWORD = 'Passw0rd!';

interface UserOverrides {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
}

/** Creates a persisted account that matches the current User schema. */
export const createUser = async (overrides: UserOverrides = {}) => {
  const email = overrides.email ?? 'user@example.com';
  const user = new UserModel({
    fullName: overrides.fullName ?? 'Test User',
    email,
    password: await hashPassword(overrides.password ?? DEFAULT_PASSWORD),
    role: overrides.role ?? 'teamManager',
    status: overrides.status ?? 'active'
  });
  user.$locals.passwordHashed = true;
  return user.save();
};

/** Cookie header for a persisted user, mirroring a completed login. */
export const authCookieFor = (user: { _id: unknown; email: string }) =>
  `auth_token=${encodeURIComponent(signToken({ sub: String(user._id), email: user.email }))}`;
