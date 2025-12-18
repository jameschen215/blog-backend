import { Router } from 'express';
import { loginUser, registerUser } from '../controller/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);

router.post('/login', validate(loginSchema), loginUser);

export default router;
