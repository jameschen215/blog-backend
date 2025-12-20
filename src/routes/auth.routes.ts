import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginUser, registerUser } from '../controller/auth.controller';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);

router.post('/login', validate(loginSchema), loginUser);

export default router;
