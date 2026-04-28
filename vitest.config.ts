import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';

const testEnv = parse(readFileSync('.env.test', 'utf-8'));

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './src/tests/global-setup.ts',
    setupFiles: ['./src/tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 15000,
    env: testEnv,
  },
});
