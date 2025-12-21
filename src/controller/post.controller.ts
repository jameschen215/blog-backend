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

    // Fetch posts and total count in parallel
    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
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
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      posts,
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
        success: false,
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

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
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
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      posts,
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

// export const getAllPosts: RequestHandler = async (req, res, next) => {
//   try {
//     const userId = req.user?.id; // From auth middleware

//     const posts = await prisma.post.findMany({
//       where: userId
//         ? {
//             OR: [
//               { published: true }, // Users see published
//               { authorId: userId, published: false }, // And their own drafts
//             ],
//           }
//         : { published: true }, // Guests only see published
//       orderBy: { createdAt: 'desc' },
//       select: {
//         id: true,
//         title: true,
//         content: true,
//         published: true,
//         createdAt: true,
//         updatedAt: true,
//         author: {
//           select: {
//             id: true,
//             username: true,
//             role: true,
//           },
//         },
//         _count: {
//           select: { comments: true },
//         },
//       },
//     });

//     res.status(200).json({ success: true, count: posts.length, posts });
//   } catch (error) {
//     next(error);
//   }
// };

export const getPostById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
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
            guestName: true,
            guestEmail: true,
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
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Authorization check: unpublished posts only visible to author
    if (!post.published && post.author.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'The post is not published',
      });
    }

    res.status(200).json({ success: true, post });
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

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    });
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
        success: false,
        message: 'Invalid post ID',
      });
    }
    console.log({ published });

    // Check if at least one field is provided - be careful for boolean value false
    if (!title && !content && published === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided',
      });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({
        success: false,
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

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post,
    });
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
        success: false,
        message: 'Invalid post ID',
      });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete other people's posts",
      });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
