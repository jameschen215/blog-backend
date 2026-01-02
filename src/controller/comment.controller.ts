import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

export const createComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.postId);
    const { content } = req.body;

    if (!postId || isNaN(postId) || postId <= 0) {
      return res.status(400).json({
        message: 'Invalid post ID',
      });
    }

    // // If not authenticated, guestName is required
    // if (!userId && !guestName) {
    //   return res.status(400).json({
    //     message: 'Name is required for guest comments',
    //   });
    // }

    // Check if post exists and is published
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
        message: 'Cannot comment on unpublished posts',
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true, role: true } },
      },
    });

    return res.status(201).json({
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.commentId);
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    // Only the author can update (no guest edits)
    if (comment.authorId !== userId) {
      return res.status(403).json({
        message: 'You can only edit your own comments',
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true, role: true } },
      },
    });

    res.status(200).json({
      comment: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.commentId);

    if (!commentId || isNaN(commentId)) {
      return res.status(400).json({
        message: 'Invalid comment ID',
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({
        message: 'You can only delete your own comments',
      });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    res.sendStatus(204).end();
  } catch (error) {
    next(error);
  }
};
