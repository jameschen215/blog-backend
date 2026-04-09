import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter } from '../config/rate-limit.config';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../controller/auth.controller';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/logout', logoutUser);

export default router;
