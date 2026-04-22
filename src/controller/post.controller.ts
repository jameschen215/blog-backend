import { RequestHandler } from 'express';
import { getPagination } from '../lib/pagination';
import {
  createPostService,
  deletePostService,
  getAllPostsService,
  getPostByIdService,
  getPostsByAuthorService,
  toggleLikeService,
  togglePublishService,
  updatePostService,
} from '../services/post.service';

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const pagination = getPagination(req.query);
    const search = req.query.search as string | undefined;
    const sort = req.query.sort as 'latest' | 'likes' | 'comments' | undefined;

    const result = await getAllPostsService({
      userId,
      pagination,
      search,
      sort,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPostsByAuthor: RequestHandler = async (req, res, next) => {
  try {
    const authorId = req.params.authorId
      ? Number(req.params.authorId)
      : req.user!.id;
    const userId = req.user?.id;

    const result = await getPostsByAuthorService({
      authorId,
      userId,
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

    const result = await toggleLikeService({ userId, postId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const togglePublish: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.postId);

    const result = await togglePublishService({ userId, postId });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
