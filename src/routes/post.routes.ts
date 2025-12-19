import { Router } from 'express';

import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
} from '../controller/post.controller';
import {
  createPostSchema,
  updatePostSchema,
} from '../validators/post.validator';
import { validate } from '../middleware/validate';
import { requireLogin, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getAllPosts);

router.get('/:postId', getPostById);

router.post(
  '/',
  requireLogin,
  requireRole('AUTHOR'),
  validate(createPostSchema),
  createPost
);

router.put(
  '/:postId',
  requireLogin,
  requireRole('AUTHOR'),
  validate(updatePostSchema),
  updatePost
);

router.delete('/:postId', requireLogin, requireRole('AUTHOR'), deletePost);

export default router;
