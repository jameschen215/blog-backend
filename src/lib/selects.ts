export const userSelect = {
  id: true,
  username: true,
  role: true,
} as const;

export const postListSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: userSelect,
  },
  _count: {
    select: { comments: true, likes: true },
  },
} as const;

export const postWriteSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: userSelect,
  },
} as const;

export const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: {
    select: userSelect,
  },
} as const;

export function postDetailSelect(userId?: number) {
  return {
    id: true,
    title: true,
    content: true,
    published: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: userSelect,
    },
    comments: {
      orderBy: { createdAt: 'desc' },
      select: commentSelect,
    },
    _count: { select: { likes: true } },
    likes: userId ? { where: { userId }, select: { id: true } } : false,
  } as const;
}
