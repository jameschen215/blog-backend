import { RequestHandler } from 'express';
import { getPagination } from '../lib/pagination';
import {
  createPostService,
  deletePostService,
  getAllPostsService,
  getPostByIdService,
  getPostsByAuthorService,
  toggleLikeRcService,
  toggleLikeService,
  updatePostService,
} from '../services/post.service';

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const pagination = getPagination(req.query);

    const result = await getAllPostsService({ userId, pagination });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPostsByAuthor: RequestHandler = async (req, res, next) => {
  try {
    const authorId = Number(req.params.authorId);
    const userId = req.user?.id;

    if (!authorId || isNaN(authorId)) {
      return res.status(400).json({
        message: 'Invalid author ID',
      });
    }

    const pagination = getPagination(req.query);
    const result = await getPostsByAuthorService({
      authorId,
      userId,
      pagination,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPostById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const result = await getPostByIdService({ postId, userId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createPost: RequestHandler = async (req, res, next) => {
  try {
    const authorId = req.user!.id;
    const { title, content, published } = req.body;
    const result = await createPostService({
      authorId,
      title,
      content,
      published,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updatePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const { title, content, published } = req.body;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        message: 'Invalid post ID',
      });
    }
    // Check if at least one field is provided - be careful for boolean value false
    if (!title && !content && published === undefined) {
      return res.status(400).json({
        message: 'At least one field must be provided',
      });
    }

    const result = await updatePostService({
      userId,
      postId,
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(published !== undefined && { published }),
      },
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deletePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);

    // Check if post ID is valid
    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        message: 'Invalid post ID',
      });
    }

    await deletePostService({ userId, postId });

    res.sendStatus(204).end();
  } catch (error) {
    next(error);
  }
};

export const toggleLike: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId < 1) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const result = await toggleLikeService({ userId, postId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const toggleLikeRC: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const requestId = Number(req.body?.requestId);

    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (!Number.isInteger(postId) || postId < 1) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const result = await toggleLikeRcService({ userId, postId, requestId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
