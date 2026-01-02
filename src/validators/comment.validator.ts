import * as z from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(500, 'Comment must be 500 characters or less')
    .trim(),

  // For guest comments
  // guestName: z
  //   .string()
  //   .min(2, 'Name must be at least 2 characters')
  //   .max(50, 'Name must be 50 characters or less')
  //   .trim()
  //   .optional(),

  // guestEmail: z.email('Invalid email').optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(500, 'Comment must be 500 characters or less')
    .trim(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
