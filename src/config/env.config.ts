import * as z from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('8000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SECRET_KEY: z.string().min(32, 'SECRET_KEY must be at least 32 characters'),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables: ');

      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });

      process.exit(1);
    }

    throw error;
  }
};
