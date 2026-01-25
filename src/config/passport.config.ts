import { Request, Response } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { prisma } from '../lib/prisma';

/**
 * Cookie configuration for JWT tokens
 */
export const cookieConfig = {
  httpOnly: true,
  secure: false, // true in production with HTTPS
  sameSite: 'lax' as const, // or 'none' if using secure: true
  path: '/',
};

/**
 * Extract JWT from cookies
 */
function cookieExtractor(req: Request): string | null {
  if (req && req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  return null;
}

/**
 * Set JWT token in secure HTTP-only cookie
 */
export function setTokenCookie(res: Response, token: string): void {
  res.cookie('jwt', token, cookieConfig);
}

/**
 * Clear JWT token cookie (for logout)
 */
export function clearTokenCookie(res: Response): void {
  res.clearCookie('jwt', cookieConfig);
}

const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.SECRET_KEY!,
};

export const jwtStrategy = new JwtStrategy(opts, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});
