import { z } from "zod";

const teamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  tag: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((value) => value.toUpperCase()),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().min(7).max(20),
  logo: z.string().url().optional(),
  description: z.string().trim().max(1000).optional(),
  organization: z.string().trim().max(200).optional(),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  team: teamSchema,
});

export const resubmitSchema = teamSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Send at least one team field",
  );

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const otpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = otpSchema.extend({
  newPassword: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ResubmitInput = z.infer<typeof resubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
