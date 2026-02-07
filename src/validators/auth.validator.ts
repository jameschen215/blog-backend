import * as z from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerSchema = z.object({
  email: z.email('Invalid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Username can only contain letters, numbers, dots, underscores, and hyphens'
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  // .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  // .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
