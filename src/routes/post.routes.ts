import { Router } from 'express';

import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostsByAuthor,
  toggleLike,
  // toggleLikeRC,
  // toggleLikeSV,
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
import {
  commentLimiter,
  postLikeLimiter,
  postLimiter,
} from '../config/rage-limit.config';

const router = Router();

// Test route
router.get('/test', requireLogin, (req, res) => {
  console.log('All cookies:', req.cookies);
  console.log('Token:', req.cookies.token);

  if (!req.cookies.token) {
    return res.status(401).json({ error: 'No token' });
  }

  res.send('Test success!');
});

// Post routes
router.get('/', optionalAuth, getAllPosts);
router.get('/author/:authorId', optionalAuth, getPostsByAuthor);
router.get('/:postId', optionalAuth, getPostById);

router.post(
  '/',
  requireLogin,
  postLimiter,
  validate(createPostSchema),
  createPost
);
router.put('/:postId', requireLogin, validate(updatePostSchema), updatePost);
router.delete('/:postId', requireLogin, deletePost);
router.post('/:postId/like', requireLogin, postLikeLimiter, toggleLike);

// Comment routes
router.post(
  '/:postId/comments',
  commentLimiter,
  // optionalAuth,
  requireLogin,
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
