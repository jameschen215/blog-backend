import { RequestHandler } from 'express';
import { getPagination } from '../lib/pagination';
import {
  createPostService,
  deletePostService,
  getAllPostsService,
  getMyPostsService,
  getPostByIdService,
  getPostsByAuthorService,
  toggleLikeService,
  togglePublishService,
  updatePostService,
} from '../services/post.service';

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    const query = (req.validated?.query ?? req.query) as {
      page?: number;
      limit?: number;
      search?: string;
      sort?: 'latest' | 'likes' | 'comments';
    };
    const pagination = getPagination(query);
    const search = query.search;
    const sort = query.sort;

    const result = await getAllPostsService({
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

    const result = await getPostsByAuthorService({ authorId });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyPosts: RequestHandler = async (req, res, next) => {
  try {
    const result = await getMyPostsService(req.user!.id);
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
