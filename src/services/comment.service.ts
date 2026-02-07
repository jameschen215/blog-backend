import { prisma } from '../lib/prisma';
import { commentSelect } from '../lib/selects';

type HttpError = Error & { statusCode?: number };

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export async function createCommentService(params: {
  userId: number;
  postId: number;
  content: string;
}) {
  const { userId, postId, content } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true },
  });

  if (!post) {
    throw createHttpError(404, 'Post not found');
  }

  if (!post.published) {
    throw createHttpError(403, 'Cannot comment on unpublished posts');
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: userId,
    },
    select: commentSelect,
  });

  return { comment };
}

export async function updateCommentService(params: {
  userId: number;
  commentId: number;
  content: string;
}) {
  const { userId, commentId, content } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw createHttpError(404, 'Comment not found');
  }

  if (comment.authorId !== userId) {
    throw createHttpError(403, 'You can only edit your own comments');
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    select: commentSelect,
  });

  return { comment: updatedComment };
}

export async function deleteCommentService(params: {
  userId: number;
  commentId: number;
}) {
  const { userId, commentId } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw createHttpError(404, 'Comment not found');
  }

  if (comment.authorId !== userId) {
    throw createHttpError(403, 'You can only delete your own comments');
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
