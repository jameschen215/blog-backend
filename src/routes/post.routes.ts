import { Router } from 'express';

import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostsByAuthor,
  updatePost,
} from '../controller/post.controller';
import {
  createPostSchema,
  updatePostSchema,
} from '../validators/post.validator';
import { validate } from '../middleware/validate';
import { optionalAuth, requireLogin } from '../middleware/auth';
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
router.get('/', optionalAuth, getAllPosts);
router.get('/author/:authorId', optionalAuth, getPostsByAuthor);
router.get('/:postId', optionalAuth, getPostById);

router.post('/', requireLogin, validate(createPostSchema), createPost);

router.put('/:postId', requireLogin, validate(updatePostSchema), updatePost);

router.delete('/:postId', requireLogin, deletePost);

// Comment routes
router.post(
  '/:postId/comments',
  optionalAuth,
  validate(createCommentSchema),
  createComment
);
router.put(
  '/:postId/comments/:commentId',
  requireLogin,
  validate(updateCommentSchema),
  updateComment
);
router.delete('/:postId/comments/:commentId', requireLogin, deleteComment);

export default router;
