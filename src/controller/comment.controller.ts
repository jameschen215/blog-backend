import { RequestHandler } from 'express';

export const getAllComments: RequestHandler = async (req, res) => {
  res.send('All comments');
};

export const getCommentById: RequestHandler = async (req, res) => {
  res.send('Comment by id');
};

export const createComment: RequestHandler = async (req, res) => {
  res.send('Create comment');
};

export const updateComment: RequestHandler = async (req, res) => {
  res.send('Update comment');
};

export const deleteComment: RequestHandler = async (req, res) => {
  res.send('Update comment');
};
