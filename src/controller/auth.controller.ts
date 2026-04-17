import { RequestHandler } from 'express';
import { clearTokenCookie, setTokenCookie } from '../config/passport.config';
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

    // Set token in secure HTTP-only cookie
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body; // Already validated by middleware
    const { user, token } = await loginUserService({ username, password });

    // Set token in secure HTTP-only cookie
    setTokenCookie(res, token);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser: RequestHandler = async (_req, res, next) => {
  try {
    clearTokenCookie(res);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
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
