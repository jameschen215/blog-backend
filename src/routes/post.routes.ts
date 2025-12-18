import { Router } from 'express';

import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
} from '../controller/post.controller';
import { requireLogin, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getAllPosts);

router.get('/:postId', requireLogin, getPostById);

router.post('/', requireLogin, requireRole('AUTHOR'), createPost);

router.put('/:postId', requireLogin, requireRole('AUTHOR'), updatePost);

router.delete('/:postId', requireLogin, requireRole('AUTHOR'), deletePost);

export default router;
