import { prisma } from '../lib/prisma';
import { commentSelect } from '../lib/selects';
import { APIError } from '../lib/api-error';

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
    throw new APIError('Post not found', 404);
  }

  if (!post.published) {
    throw new APIError('Cannot comment on unpublished posts', 403);
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
  postId: number;
  commentId: number;
  content: string;
}) {
  const { userId, postId, commentId, content } = params;

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId },
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  if (comment.authorId !== userId) {
    throw new APIError('You can only edit your own comments', 403);
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
  postId: number;
  commentId: number;
}) {
  const { userId, postId, commentId } = params;

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    include: { post: { select: { authorId: true } } },
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  // Allow comment author OR post author to delete
  if (comment.authorId !== userId && comment.post.authorId !== userId) {
    throw new APIError('You can only delete your own comments', 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
