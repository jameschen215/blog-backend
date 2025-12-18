import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../../lib/prisma';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
        // Do not include password
      },
    });

    if (!user) {
      return done(null, false);
    }

    // Remove bcrypt comparison - JWT already verified!
    return done(null, user);
  } catch (error) {
    done(error);
  }
});
