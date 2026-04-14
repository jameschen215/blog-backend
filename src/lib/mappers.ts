export type UserShape = {
  id: number;
  username: string;
  role: string;
};

export function mapUser(user: UserShape) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

export type PostListShape = {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: UserShape;
  _count: { comments: number; likes: number };
};

export function mapPostList(post: PostListShape) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: mapUser(post.author),
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
  };
}

export type CommentShape = {
  id: number;
  content: string;
  createdAt: Date;
  author: UserShape;
};

export function mapComment(comment: CommentShape) {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: mapUser(comment.author),
  };
}

export type PostDetailShape = {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: UserShape;
  comments: CommentShape[];
  _count: { likes: number };
  likes?: Array<{ id: number }>;
};

export function mapPostDetail(post: PostDetailShape) {
  const isLikedByCurrentUser =
    Array.isArray(post.likes) && post.likes.length > 0;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: mapUser(post.author),
    comments: post.comments.map(mapComment),
    likesCount: post._count.likes,
    commentsCount: post.comments.length,
    isLikedByCurrentUser,
  };
}
