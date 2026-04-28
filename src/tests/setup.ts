import { afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

beforeEach(async () => {
  await pool.query(
    'TRUNCATE TABLE likes, comments, posts, users RESTART IDENTITY CASCADE'
  );
});

afterAll(async () => {
  await pool.end();
});
