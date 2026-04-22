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
import { Prisma } from '../generated/prisma/client';

type SortKey = 'latest' | 'likes' | 'comments';

export async function getAllPostsService(params: {
  userId?: number;
  pagination: Pagination;
  search?: string;
  sort?: SortKey;
}) {
  const { userId, pagination, search, sort = 'latest' } = params;
  const { page, limit, skip } = pagination;

  const where: Prisma.PostWhereInput = {
    AND: [
      userId
        ? { OR: [{ published: true }, { authorId: userId, published: false }] }
        : { published: true },
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { content: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sort === 'likes'
      ? { likes: { _count: 'desc' } }
      : sort === 'comments'
        ? { comments: { _count: 'desc' } }
        : { createdAt: 'desc' };

  const total = await prisma.post.count({ where });
  const posts = await prisma.post.findMany({
    where,
    orderBy,
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
}) {
  const { authorId, userId } = params;

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

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ published: 'desc' }, { updatedAt: 'desc' }, { title: 'asc' }],
    select: postListSelect,
  });

  return {
    user: author,
    posts: posts.map(mapPostList),
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
  };
}
export async function togglePublishService(params: {
  userId: number;
  postId: number;
}) {
  const { userId, postId } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true, authorId: true },
  });

  if (!post) {
    throw new APIError('Post not found', 404);
  }

  if (post.authorId !== userId) {
    throw new APIError("Cannot change other people's posts", 403);
  }

  const result = await prisma.post.update({
    where: { id: postId },
    data: { published: !post.published },
  });

  return {
    published: result.published,
  };
}
