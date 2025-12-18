import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { email, username, password, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      if (existingUser.username === username) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role || 'READER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token (auto-login after registration)
    const jwtPayload = { id: newUser.id, role: newUser.role };
    const secretKey = process.env.SECRET_KEY!;
    const token = jwt.sign(jwtPayload, secretKey, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body; // Already validated by middleware

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secretKey = process.env.SECRET_KEY!;
    // Include role for authorization
    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
      expiresIn: '7d',
    });

    res.status(200).json({
      success: true,
      message: 'Login successfully',
      token,
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
