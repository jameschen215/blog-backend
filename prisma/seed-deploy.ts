import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  const hashedPassword = await bcrypt.hash('820215', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'james@odin.com' },
    update: {},
    create: {
      email: 'james@odin.com',
      username: 'James',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

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
