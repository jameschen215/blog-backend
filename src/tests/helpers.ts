import request from 'supertest';
import app from '../app';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  token: string;
  cookie: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function buildUserData(overrides?: Partial<{ email: string; username: string; password: string }>) {
  const id = uid();
  return {
    email: `user.${id}@test.com`,
    username: `user${id}`,
    password: 'Password1!',
    ...overrides,
  };
}

export async function createUser(
  overrides?: Partial<{ email: string; username: string; password: string }>
): Promise<AuthUser> {
  const data = buildUserData(overrides);
  const res = await request(app).post('/api/auth/register').send(data);
  const { user, token } = res.body as { user: Omit<AuthUser, 'token' | 'cookie'>; token: string };
  return { ...user, token, cookie: `jwt=${token}` };
}

export async function createPost(
  cookie: string,
  overrides?: Partial<{ title: string; content: string; published: boolean }>
) {
  const res = await request(app)
    .post('/api/posts')
    .set('Cookie', cookie)
    .send({
      title: 'Test post title',
      content: 'Test post content',
      published: false,
      ...overrides,
    });
  return res.body.post as { id: number; title: string; content: string; published: boolean };
}
