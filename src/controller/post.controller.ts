import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    // const userId = req.user?.id; // From auth middleware
    const userId = null;

    const posts = await prisma.post.findMany({
      where: userId
        ? { authorId: userId } // If authenticated, show their posts (including drafts)
        : { published: true }, // If not authenticated, show only published posts
      orderBy: { createdAt: 'desc' },
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
          select: { comments: true },
        },
      },
    });

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

export const getPostById: RequestHandler = async (req, res, next) => {
  try {
    const userId = null; // auth not configured, null for temporary
    const postId = Number(req.params.postId);

    if (!postId || isNaN(postId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid post ID' });
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
      },
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // Authorization check: unpublished posts only visible to author
    if (!post.published && post.author.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

export const createPost: RequestHandler = async (req, res) => {
  res.send('Create post');
};

export const updatePost: RequestHandler = async (req, res) => {
  res.send('Update post');
};

export const deletePost: RequestHandler = async (req, res) => {
  res.send('Update post');
};
