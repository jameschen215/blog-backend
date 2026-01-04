import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    // Pagination parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    // if query with limit and it's not greater than 50, use it, or use 10
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    // Build where clause
    const where = userId
      ? { OR: [{ published: true }, { authorId: userId, published: false }] }
      : { published: true };

    const total = await prisma.post.count({ where });
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    res.status(200).json({
      posts: posts.map((post) => ({ ...post, likesCount: post._count.likes })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostsByAuthor: RequestHandler = async (req, res, next) => {
  try {
    const authorId = Number(req.params.authorId);
    const userId = req.user?.id;

    if (!authorId || isNaN(authorId)) {
      return res.status(400).json({
        message: 'Invalid author ID',
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    // Show drafts only if viewing own posts
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
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    res.status(200).json({
      posts: posts.map((post) => ({ ...post, likesCount: post._count.likes })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);

    console.log('Loader: ');
    console.log('--------------');
    console.log({ userId, postId });

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        _count: { select: { likes: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
      });
    }

    // Authorization check: unpublished posts only visible to author
    if (!post.published && post.author.id !== userId) {
      return res.status(403).json({
        message: 'The post is not published',
      });
    }

    const isLikedByCurrentUser = userId
      ? Array.isArray(post.likes) && post.likes.length > 0
      : false;

    console.log({ isLikedByCurrentUser });

    res.status(200).json({
      post: {
        ...post,
        likesCount: post._count.likes,
        likes: undefined,
        isLikedByCurrentUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPost: RequestHandler = async (req, res, next) => {
  try {
    const authorId = req.user!.id;
    const { title, content, published } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: published || false,
        authorId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
};

export const updatePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const { title, content, published } = req.body;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        message: 'Invalid post ID',
      });
    }
    console.log({ published });

    // Check if at least one field is provided - be careful for boolean value false
    if (!title && !content && published === undefined) {
      return res.status(400).json({
        message: 'At least one field must be provided',
      });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({
        message: 'Post not found',
      });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({
        message: "Cannot update other people's posts",
      });
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(published !== undefined && { published }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
};

export const deletePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);

    // Check if post ID is valid
    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        message: 'Invalid post ID',
      });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({
        message: 'Post not found',
      });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({
        message: "Cannot delete other people's posts",
      });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.sendStatus(204).end();
  } catch (error) {
    next(error);
  }
};

export const toggleLike: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const requestId = Number(req.body?.requestId);

    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (!Number.isInteger(postId) || postId < 1) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
      });
    }

    if (!post.published) {
      return res.status(403).json({
        message: 'Cannot like an unpublished post',
      });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      const likesCount = await prisma.like.count({
        where: { postId },
      });

      return res.status(200).json({
        liked: false,
        likes: likesCount,
        requestId,
      });
    }

    // Like
    await prisma.like.create({
      data: { userId, postId },
    });

    const likesCount = await prisma.like.count({
      where: { postId },
    });

    res.status(200).json({
      liked: true,
      likes: likesCount,
      requestId,
    });
  } catch (error) {
    next(error);
  }
};
