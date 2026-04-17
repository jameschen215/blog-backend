import { Router } from 'express';
import { getCurrentUser } from '../controller/auth.controller';
import { requireLogin } from '../middleware/auth';

const router = Router();

router.get('/me', requireLogin, getCurrentUser);

export default router;
