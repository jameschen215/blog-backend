import { RequestHandler } from 'express';

export const getAllPosts: RequestHandler = async (req, res) => {
  res.send('All posts');
};

export const getPostById: RequestHandler = async (req, res) => {
  res.send('Post by id');
};

export const createPost: RequestHandler = async (req, res) => {
  res.send('Create post');
};

export const updatePost: RequestHandler = async (req, res) => {
  res.send('Update post');
};

export const deletePost: RequestHandler = async (req, res) => {
  res.send('Update post');
};
