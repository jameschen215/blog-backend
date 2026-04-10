import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from '../lib/prisma';
import { buildPaginationMeta, Pagination } from '../lib/pagination';
import { mapPostDetail, mapPostList } from '../lib/mappers';
import { APIError } from '../lib/api-error';
import {
  postDetailSelect,
  postListSelect,
  postWriteSelect,
} from '../lib/selects';

export async function getAllPostsService(params: {
  userId?: number;
  pagination: Pagination;
}) {
  const { userId, pagination } = params;
  const { page, limit, skip } = pagination;

  const where = userId
    ? { OR: [{ published: true }, { authorId: userId, published: false }] }
    : { published: true };

  const total = await prisma.post.count({ where });
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: postListSelect,
  });

  return {
    posts: posts.map(mapPostList),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getPostsByAuthorService(params: {
  authorId: number;
  userId?: number;
  pagination: Pagination;
}) {
  const { authorId, userId, pagination } = params;
  const { page, limit, skip } = pagination;

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true, username: true },
  });

  if (!author) {
    throw new APIError('User not found', 404);
  }

  const where = {
    authorId,
    ...(userId === authorId ? {} : { published: true }),
  };

  const total = await prisma.post.count({ where });
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: postListSelect,
  });

  return {
    user: author,
    posts: posts.map(mapPostList),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getPostByIdService(params: {
  postId: number;
  userId?: number;
}) {
  const { postId, userId } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: postDetailSelect(userId),
  });

  if (!post) {
    throw new APIError('Post not found', 404);
  }

  if (!post.published && post.author.id !== userId) {
    throw new APIError('The post is not published', 403);
  }

  return {
    post: mapPostDetail(post),
  };
}

export async function createPostService(params: {
  authorId: number;
  title: string;
  content: string;
  published?: boolean;
}) {
  const { authorId, title, content, published } = params;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      published: published || false,
      authorId,
    },
    select: postWriteSelect,
  });

  return { post };
}

export async function updatePostService(params: {
  userId: number;
  postId: number;
  data: { title?: string; content?: string; published?: boolean };
}) {
  const { userId, postId, data } = params;

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new APIError('Post not found', 404);
  }

  if (existingPost.authorId !== userId) {
    throw new APIError("Cannot update other people's posts", 403);
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data,
    select: postWriteSelect,
  });

  return { post };
}

export async function deletePostService(params: {
  userId: number;
  postId: number;
}) {
  const { userId, postId } = params;

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new APIError('Post not found', 404);
  }

  if (existingPost.authorId !== userId) {
    throw new APIError("Cannot delete other people's posts", 403);
  }

  await prisma.post.delete({
    where: { id: postId },
  });
}

export async function toggleLikeService(params: {
  userId: number;
  postId: number;
}) {
  const { userId, postId } = params;
  let liked = false;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true },
  });

  if (!post) {
    throw new APIError('Post not found', 404);
  }

  if (!post.published) {
    throw new APIError('Cannot like an unpublished post', 403);
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existingLike) {
    try {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      liked = false;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        liked = false;
      } else {
        throw error;
      }
    }
  } else {
    try {
      await prisma.like.create({
        data: { userId, postId },
      });
      liked = true;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        liked = true;
      } else {
        throw error;
      }
    }
  }

  const likesCount = await prisma.like.count({
    where: { postId },
  });

  return {
    liked,
    likes: likesCount,
  };
}

export async function toggleLikeRcService(params: {
  userId: number;
  postId: number;
  requestId: number;
}) {
  const { userId, postId, requestId } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true },
  });

  if (!post) {
    throw new APIError('Post not found', 404);
  }

  if (!post.published) {
    throw new APIError('Cannot like an unpublished post', 403);
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingLike = await tx.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    let liked: boolean;

    if (existingLike) {
      await tx.like.delete({
        where: { id: existingLike.id },
      });

      liked = false;
    } else {
      try {
        await tx.like.create({
          data: { userId, postId },
        });

        liked = true;
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          liked = true;
        } else {
          throw error;
        }
      }
    }

    const likesCount = await tx.like.count({
      where: { postId },
    });

    return { liked, likesCount };
  });

  return {
    liked: result.liked,
    likes: result.likesCount,
    requestId,
  };
}
export async function togglePublishService(postId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true },
  });

  if (!post) {
    throw new APIError('Post not found', 404);
  }

  const result = await prisma.post.update({
    where: { id: postId },
    data: { published: !post.published },
  });

  return {
    published: result.published,
  };
}
