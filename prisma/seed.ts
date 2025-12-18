import 'dotenv/config';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USERS_COUNT = 7;
const POSTS_PER_USER = 3;
const COMMENTS_PER_POST = 5;

async function main() {
  // 1. Clean database (dev only)
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create users
  const hashedPassword = await bcrypt.hash('123456', 10);

  const author = await prisma.user.create({
    data: {
      email: 'james@odin.com',
      username: 'james.chen',
      password: hashedPassword,
      role: Role.AUTHOR,
    },
  });

  const users = await Promise.all(
    Array.from({ length: USERS_COUNT }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.username(),
          password: hashedPassword,
          role: Role.READER,
        },
      })
    )
  );

  // 3. Create posts (only authors)
  const posts = [];

  for (let i = 0; i < POSTS_PER_USER; i++) {
    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(5),
        published: faker.datatype.boolean(),
        authorId: author.id,
      },
    });

    posts.push(post);
  }

  // 4. Create comments (any user can comment)
  for (const post of posts) {
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const randomUser = faker.helpers.arrayElement(users);

      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(2),
          postId: post.id,
          authorId: randomUser.id,
        },
      });
    }
  }

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
