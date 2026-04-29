import { RequestHandler } from 'express';
import { mapCurrentUser } from '../lib/mappers';
import {
  loginUserService,
  registerUserService,
} from '../services/auth.service';

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const { user, token } = await registerUserService({
      email,
      username,
      password,
    });

    res.status(201).json({
      user: mapCurrentUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body; // Already validated by middleware
    const { user, token } = await loginUserService({ username, password });

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true });
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json({
      user: mapCurrentUser(req.user!),
    });
  } catch (error) {
    next(error);
  }
};
