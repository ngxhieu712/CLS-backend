import { Router } from 'express';
import {
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  resubmitProfile,
  verifyRegisterOtp,
  logout
} from '../controllers/auth.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  otpSchema,
  registerSchema,
  resetPasswordSchema,
  resubmitSchema
} from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/register/verify-otp', validateBody(otpSchema), verifyRegisterOtp);
authRouter.patch('/resubmit', authGuard, validateBody(resubmitSchema), resubmitProfile);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
authRouter.get('/me', authGuard, getMe);
authRouter.post('/logout', authGuard, logout);
