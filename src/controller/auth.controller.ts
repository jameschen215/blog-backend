import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { setTokenCookie } from '../config/passport.config';

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
          message: 'Email already registered',
        });
      }

      if (existingUser.username === username) {
        return res.status(409).json({
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
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-claim guest comments if email matches and keep guestName in case user is deleted
    // const claimedComments = await prisma.comment.updateMany({
    //   where: { guestEmail: email, authorId: null },
    //   data: {
    //     authorId: newUser.id,
    //     guestEmail: null,
    //     // guestName: null,
    //   },
    // });

    // Generate token (auto-login after registration)
    const jwtPayload = { id: newUser.id, role: newUser.role };
    const secretKey = process.env.SECRET_KEY!;
    const token = jwt.sign(jwtPayload, secretKey, { expiresIn: '7d' });

    // Set token in secure HTTP-only cookie
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      // claimedComments: claimedComments.count,
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
      return res.status(401).json({ message: 'Invalid credentials' });
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

    // Set token in secure HTTP-only cookie
    setTokenCookie(res, token);

    res.status(200).json({
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
