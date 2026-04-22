import { RequestHandler } from 'express';
import {
  createCommentService,
  deleteCommentService,
  updateCommentService,
} from '../services/comment.service';

export const createComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const { content } = req.body;

    const result = await createCommentService({ userId, postId, content });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const commentId = Number(req.params.commentId);
    const { content } = req.body;

    const result = await updateCommentService({
      userId,
      postId,
      commentId,
      content,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const commentId = Number(req.params.commentId);

    await deleteCommentService({ userId, postId, commentId });

    res.sendStatus(204).end();
  } catch (error) {
    next(error);
  }
};
