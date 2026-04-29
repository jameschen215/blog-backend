import { Request } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { prisma } from '../lib/prisma';

function cookieExtractor(req: Request): string | null {
  if (req && req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  return null;
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
