import { execSync } from 'child_process';
import { config } from 'dotenv';

export default function setup() {
  config({ path: '.env.test' });
  execSync('npx prisma migrate deploy', {
    env: process.env,
    stdio: 'inherit',
  });
}
