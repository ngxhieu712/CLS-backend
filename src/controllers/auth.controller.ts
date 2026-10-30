import { Request, Response } from "express";
import { env } from "../config/env";
import { TeamModel } from "../models/team.model";
import { UserModel } from "../models/user.model";
import { forbidden, unauthorized } from "../utils/app-error";
import { signToken } from "../utils/jwt";
import { signGoogleRegistrationTicket } from '../utils/jwt';
import { verifyGoogleIdToken } from '../services/google-auth.service';
import * as userService from "../services/user.service";
import type {
  LoginInput,
  GoogleRegistrationInput,
  RegisterInput,
  ResetPasswordInput,
  ResubmitInput,
} from "../validators/auth.validator";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure,
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

const signIn = (res: Response, user: { _id: unknown; email: string; fullName: string; role: string; status: string }) =>
  res.cookie('auth_token', signToken({ sub: String(user._id), email: user.email }), cookieOptions).json({
    user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status },
  });

export const register = async (req: Request, res: Response) => {
  await userService.beginTeamRegistration(req.body as RegisterInput);
  res.status(201).json({ message: "OTP has been sent to your email" });
};

export const verifyRegisterOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };
  await userService.completeTeamRegistration(email, otp);
  res.status(201).json({ message: "Team profile submitted for approval" });
};

export const resubmitProfile = async (req: Request, res: Response) =>
  res.json(
    await userService.resubmitTeamProfile(
      req.user!.sub,
      req.body as ResubmitInput,
    ),
  );

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const user = await UserModel.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password)))
    throw unauthorized("Invalid email or password");
  if (user.status === "locked") throw forbidden("This account is locked");
  signIn(res, user);
};

export const googleLogin = async (req: Request, res: Response) => {
  const identity = await verifyGoogleIdToken((req.body as { idToken: string }).idToken);
  const result = await userService.continueWithGoogle(identity);
  if ('user' in result && result.user) return signIn(res, result.user);
  return res.json({
    needsRegistration: true,
    email: result.email,
    fullName: result.fullName,
    registrationTicket: signGoogleRegistrationTicket(result),
  });
};

export const completeGoogleRegistration = async (req: Request, res: Response) => {
  await userService.completeGoogleTeamRegistration(req.body as GoogleRegistrationInput);
  res.status(201).json({ message: 'Team profile submitted for approval' });
};

export const logout = (_req: Request, res: Response) =>
  res
    .clearCookie("auth_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      path: "/",
    })
    .status(204)
    .end();

export const forgotPassword = async (req: Request, res: Response) => {
  await userService.beginPasswordReset((req.body as { email: string }).email);
  res.json({ message: "If the email exists, an OTP has been sent" });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as ResetPasswordInput;
  await userService.resetPasswordWithOtp(email, otp, newPassword);
  res.json({ message: "Password reset successful" });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user!.sub);
  if (!user) throw unauthorized();
  const team =
    user.role === "teamManager"
      ? await TeamModel.findOne({ manager: user._id }).select(
          "_id profileStatus rejectReason",
        )
      : null;
  res.json({
    ...user.toJSON(),
    teamId: team?._id,
    teamProfileStatus: team?.profileStatus,
    rejectReason: team?.rejectReason,
  });
};
