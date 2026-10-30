import {
  OtpModel,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_TTL_MS,
} from "../models/otp.model";
import { TeamModel } from "../models/team.model";
import { TournamentModel } from "../models/tournament.model";
import { UserModel } from "../models/user.model";
import { badRequest, conflict, forbidden, notFound } from "../utils/app-error";
import { hashPassword } from "../utils/hash";
import { verifyGoogleRegistrationTicket } from "../utils/jwt";
import { sendOtpEmail, sendResetTokenEmail } from "./email.service";
import type {
  GoogleRegistrationInput,
  RegisterInput,
  ResubmitInput,
} from "../validators/auth.validator";
import type { VerifiedGoogleIdentity } from './google-auth.service';

const registrationTournament = async () => {
  const tournament = await TournamentModel.findOne().sort({ createdAt: 1 });
  if (!tournament || tournament.status !== 'registration')
    throw badRequest('Tournament registration is closed');
  return tournament;
};

const expiration = () => new Date(Date.now() + OTP_TTL_MS);
const issueOtp = async (
  email: string,
  purpose: "register" | "resetPassword",
  input?: RegisterInput,
) => {
  const existing = await OtpModel.findOne({ email, purpose });
  if (existing && Date.now() - existing.lastSentAt.getTime() < OTP_RESEND_MS)
    throw badRequest("Please wait 60 seconds before requesting another OTP");
  const code = OtpModel.generateCode();
  await OtpModel.findOneAndUpdate(
    { email, purpose },
    {
      codeHash: OtpModel.hashCode(email, code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: expiration(),
      ...(input
        ? {
            fullName: input.fullName,
            passwordHash: await hashPassword(input.password),
            teamInfo: input.team,
          }
        : {}),
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await (purpose === "register"
    ? sendOtpEmail(email, code)
    : sendResetTokenEmail(email, code));
};

export const beginTeamRegistration = async (input: RegisterInput) => {
  const tournament = await registrationTournament();
  if (await UserModel.exists({ email: input.email }))
    throw conflict("Email already exists");
  if (
    await TeamModel.exists({
      tournament: tournament._id,
      $or: [{ name: input.team.name }, { tag: input.team.tag }],
    })
  )
    throw conflict("Team name or tag already exists");
  await issueOtp(input.email, "register", input);
};
const consumeOtp = async (
  email: string,
  purpose: "register" | "resetPassword",
  code: string,
) => {
  const otp = await OtpModel.findOne({ email, purpose });
  if (!otp || otp.expiresAt.getTime() < Date.now())
    throw badRequest("Invalid or expired OTP");
  if (!otp.matches(code)) {
    otp.attempts += 1;
    if (otp.attempts >= OTP_MAX_ATTEMPTS) await otp.deleteOne();
    else await otp.save();
    throw badRequest("Invalid or expired OTP");
  }
  return otp;
};
export const completeTeamRegistration = async (email: string, code: string) => {
  const otp = await consumeOtp(email, "register", code);
  const tournament = await registrationTournament();
  if (
    !otp.fullName ||
    !otp.passwordHash ||
    !otp.teamInfo?.name ||
    !otp.teamInfo.tag ||
    !otp.teamInfo.contactEmail ||
    !otp.teamInfo.contactPhone
  )
    throw badRequest("Registration data is incomplete");
  if (await UserModel.exists({ email })) throw conflict("Email already exists");
  const user = await UserModel.create({
    fullName: otp.fullName,
    email,
    password: otp.passwordHash,
    role: "teamManager",
    status: "pending",
    $locals: { passwordHashed: true },
  });
  try {
    await TeamModel.create({
      ...otp.teamInfo,
      manager: user._id,
      tournament: tournament._id,
      profileStatus: "pending",
    });
  } catch (error) {
    await UserModel.findByIdAndDelete(user._id);
    throw error;
  }
  await otp.deleteOne();
};

/** Finds an existing Google account or asks the client to finish team registration. */
export const continueWithGoogle = async (identity: VerifiedGoogleIdentity) => {
  const byGoogleId = await UserModel.findOne({ googleId: identity.googleId });
  if (byGoogleId) {
    if (byGoogleId.email !== identity.email) throw forbidden('Google identity does not match this account');
    if (byGoogleId.status === 'locked') throw forbidden('This account is locked');
    return { user: byGoogleId };
  }

  const byEmail = await UserModel.findOne({ email: identity.email });
  if (byEmail) {
    if (byEmail.status === 'locked') throw forbidden('This account is locked');
    if (byEmail.googleId && byEmail.googleId !== identity.googleId)
      throw conflict('This email is already linked to another Google account');
    byEmail.googleId = identity.googleId;
    await byEmail.save();
    return { user: byEmail };
  }

  return { needsRegistration: true as const, email: identity.email, fullName: identity.fullName, googleId: identity.googleId };
};

/** Completes first-time Google registration from the short-lived signed ticket. */
export const completeGoogleTeamRegistration = async (input: GoogleRegistrationInput) => {
  let ticket: ReturnType<typeof verifyGoogleRegistrationTicket>;
  try {
    ticket = verifyGoogleRegistrationTicket(input.registrationTicket);
  } catch {
    throw badRequest('Invalid or expired Google registration ticket');
  }
  const tournament = await registrationTournament();
  if (await UserModel.exists({ $or: [{ email: ticket.email }, { googleId: ticket.googleId }] }))
    throw conflict('An account already exists for this Google identity');
  if (await TeamModel.exists({ tournament: tournament._id, $or: [{ name: input.team.name }, { tag: input.team.tag }] }))
    throw conflict('Team name or tag already exists');

  const user = await UserModel.create({
    fullName: ticket.fullName,
    email: ticket.email,
    googleId: ticket.googleId,
    role: 'teamManager',
    status: 'pending',
  });
  try {
    const team = await TeamModel.create({
      ...input.team,
      manager: user._id,
      tournament: tournament._id,
      profileStatus: 'pending',
    });
    return team;
  } catch (error) {
    await UserModel.findByIdAndDelete(user._id);
    throw error;
  }
};
export const resubmitTeamProfile = async (
  userId: string,
  input: ResubmitInput,
) => {
  const user = await UserModel.findById(userId);
  if (!user || user.role !== "teamManager") throw forbidden();
  if (user.status !== "rejected")
    throw badRequest("Only rejected team profiles can be resubmitted");
  const team = await TeamModel.findOneAndUpdate(
    { manager: user._id },
    { ...input, profileStatus: "pending", rejectReason: "" },
    { new: true, runValidators: true },
  );
  if (!team) throw notFound("Team profile not found");
  user.status = "pending";
  await user.save();
  return team;
};
export const beginPasswordReset = async (email: string) => {
  if (await UserModel.exists({ email })) await issueOtp(email, "resetPassword");
};
export const resetPasswordWithOtp = async (
  email: string,
  code: string,
  password: string,
) => {
  const otp = await consumeOtp(email, "resetPassword", code);
  const user = await UserModel.findOne({ email });
  if (!user) throw badRequest("Invalid or expired OTP");
  user.password = await hashPassword(password);
  user.$locals.passwordHashed = true;
  await user.save();
  await otp.deleteOne();
};
