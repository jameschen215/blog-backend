import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { APIError } from '../lib/api-error';

type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

type LoginInput = {
  username: string;
  password: string;
};

export async function registerUserService(input: RegisterInput) {
  const { email, username, password } = input;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new APIError('Email already registered', 409);
    }

    if (existingUser.username === username) {
      throw new APIError('Username already taken', 409);
    }
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  const secretKey = process.env.SECRET_KEY!;
  const token = jwt.sign(
    {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    },
    secretKey,
    { expiresIn: '7d' }
  );

  return { user: newUser, token };
}

export async function loginUserService(input: LoginInput) {
  const { username, password } = input;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new APIError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new APIError('Invalid credentials', 401);
  }

  const secretKey = process.env.SECRET_KEY!;
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    secretKey,
    {
      expiresIn: '7d',
    }
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  };
}
