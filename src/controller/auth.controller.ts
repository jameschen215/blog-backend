import { RequestHandler } from 'express';

export const registerUser: RequestHandler = async (req, res) => {
  res.send('Register user');
};

export const loginUser: RequestHandler = async (req, res) => {
  res.send('Login user');
};
