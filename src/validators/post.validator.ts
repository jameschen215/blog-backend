import * as z from 'zod';

const positiveInt = z.coerce.number().int().positive();

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

export const postIdParamSchema = z.object({
  postId: positiveInt,
});

export const authorIdParamSchema = z.object({
  authorId: positiveInt,
});

export const postListQuerySchema = z.object({
  page: positiveInt.optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(['latest', 'likes', 'comments']).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
