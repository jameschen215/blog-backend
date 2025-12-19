import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

export const createComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { content, postId, guestName, guestEmail } = req.body;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
      });
    }

    // If not authenticated, guestName is required
    if (!userId && !guestName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required for guest comments',
      });
    }

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (!post.published) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on unpublished posts',
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        ...(userId
          ? { authorId: userId }
          : { guestName, guestEmail: guestEmail || null }),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: userId
          ? { select: { id: true, username: true, role: true } }
          : undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment: RequestHandler = async (req, res) => {
  res.send('Update comment');
};

export const deleteComment: RequestHandler = async (req, res) => {
  res.send('Update comment');
};
