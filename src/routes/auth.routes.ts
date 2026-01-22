import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter } from '../config/rage-limit.config';
import { loginUser, registerUser } from '../controller/auth.controller';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/register', authLimiter, validate(registerSchema), registerUser);

export default router;
