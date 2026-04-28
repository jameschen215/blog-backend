import { Router } from 'express';

import {
  createPost,
  deletePost,
  getAllPosts,
  getMyPosts,
  getPostById,
  getPostsByAuthor,
  toggleLike,
  togglePublish,
  updatePost,
} from '../controller/post.controller';
import {
  authorIdParamSchema,
  createPostSchema,
  postIdParamSchema,
  postListQuerySchema,
  updatePostSchema,
} from '../validators/post.validator';
import { validate } from '../middleware/validate';
import { optionalAuth, requireLogin } from '../middleware/auth';
import {
  commentParamsSchema,
  commentPostParamsSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validator';
import {
  createComment,
  deleteComment,
  updateComment,
} from '../controller/comment.controller';
import {
  commentLimiter,
  postLikeLimiter,
  postLimiter,
} from '../config/rate-limit.config';

const router = Router();

// Post routes
router.get(
  '/',
  optionalAuth,
  validate({ query: postListQuerySchema }),
  getAllPosts
);
router.get('/me', requireLogin, getMyPosts);
router.get(
  '/authors/:authorId',
  optionalAuth,
  validate({ params: authorIdParamSchema }),
  getPostsByAuthor
);
router.get(
  '/:postId',
  optionalAuth,
  validate({ params: postIdParamSchema }),
  getPostById
);

router.post(
  '/',
  requireLogin,
  postLimiter,
  validate(createPostSchema),
  createPost
);
router.put(
  '/:postId',
  requireLogin,
  validate({ params: postIdParamSchema, body: updatePostSchema }),
  updatePost
);
router.delete(
  '/:postId',
  requireLogin,
  validate({ params: postIdParamSchema }),
  deletePost
);
router.post(
  '/:postId/like',
  requireLogin,
  validate({ params: postIdParamSchema }),
  postLikeLimiter,
  toggleLike
);
router.post(
  '/:postId/publish',
  requireLogin,
  validate({ params: postIdParamSchema }),
  togglePublish
);

// Comment routes
router.post(
  '/:postId/comments',
  requireLogin,
  validate({ params: commentPostParamsSchema }),
  commentLimiter,
  validate(createCommentSchema),
  createComment
);
router.put(
  '/:postId/comments/:commentId',
  requireLogin,
  validate({ params: commentParamsSchema, body: updateCommentSchema }),
  updateComment
);
router.delete(
  '/:postId/comments/:commentId',
  requireLogin,
  validate({ params: commentParamsSchema }),
  deleteComment
);

export default router;
