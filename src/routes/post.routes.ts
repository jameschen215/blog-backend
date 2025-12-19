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
import {
  createCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validator';
import {
  createComment,
  deleteComment,
  updateComment,
} from '../controller/comment.controller';

const router = Router();

// Post routes
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

// Comment routes
router.post('/:postId/comments', validate(createCommentSchema), createComment);
router.put(
  '/:postId/comments/:commentId',
  requireLogin,
  validate(updateCommentSchema),
  updateComment
);
router.delete('/:postId/comments/:commentId', requireLogin, deleteComment);

export default router;
