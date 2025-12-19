import * as z from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .trim(),

  content: z.string().min(1, 'Content is required').trim(),

  published: z.boolean().optional().default(false),
});

export const updatePostSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be 255 characters or less')
      .trim()
      .optional(),

    content: z.string().min(1, 'Content is required').trim().optional(),

    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
