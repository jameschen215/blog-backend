import 'dotenv/config';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { getRandomInt } from '../src/lib/utils';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;
const USERS_COUNT = getRandomInt({ min: 3, max: 5 });
const POSTS_PER_USER = getRandomInt({ min: 3, max: 10 });
const COMMENTS_PER_POST = getRandomInt({ min: 3, max: 5 });

console.log({ USERS_COUNT, POSTS_PER_USER, COMMENTS_PER_POST });

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Seeding is only allowed in development environment');
  }

  // 1. Clean database (dev only)
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.like.deleteMany();

  // 2. Create users
  const hashedPassword = await bcrypt.hash('123456', SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: 'james@odin.com',
      username: 'james.chen',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const users = await Promise.all(
    Array.from({ length: USERS_COUNT }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.username(),
          password: hashedPassword,
          role: Role.USER,
        },
      })
    )
  );

  // 3. Create posts
  const posts = [];

  for (let i = 0; i < POSTS_PER_USER; i++) {
    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(getRandomInt({ min: 4, max: 10 })),
        published: faker.datatype.boolean(),
        authorId: admin.id,
      },
    });

    posts.push(post);
  }

  for (const user of users) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const post = await prisma.post.create({
        data: {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(getRandomInt({ min: 4, max: 10 })),
          published: faker.datatype.boolean(),
          authorId: user.id,
        },
      });

      posts.push(post);
    }
  }

  // 4. Create comments
  for (const post of posts) {
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const randomUser = faker.helpers.arrayElement(users);

      await prisma.comment.create({
        data: {
          content: faker.lorem.sentences(getRandomInt({ max: 5 })),
          postId: post.id,
          authorId: randomUser.id,
        },
      });
    }
  }

  // 5. Create likes
  for (const post of posts) {
    for (const user of users) {
      await prisma.like.create({
        data: { postId: post.id, userId: user.id },
      });
    }
  }

  console.log('Posts: ', posts.length);

  console.log('🌱 Database seeded successfully!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
