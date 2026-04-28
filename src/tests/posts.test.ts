import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createUser, createPost } from './helpers';

describe('GET /api/posts', () => {
  it('returns empty list when there are no published posts', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.posts).toEqual([]);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns only published posts', async () => {
    const user = await createUser();
    await createPost(user.cookie, { title: 'Draft', published: false });
    await createPost(user.cookie, { title: 'Published', published: true });

    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].title).toBe('Published');
  });

  it('filters posts by search query', async () => {
    const user = await createUser();
    await createPost(user.cookie, {
      title: 'TypeScript tips',
      published: true,
    });
    await createPost(user.cookie, {
      title: 'Go best practices',
      published: true,
    });

    const res = await request(app).get('/api/posts?search=typescript');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].title).toBe('TypeScript tips');
  });

  it('returns 400 for invalid query params', async () => {
    const res = await request(app).get('/api/posts?page=abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/posts', () => {
  it('creates a post and returns 201', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', user.cookie)
      .send({ title: 'My Post', content: 'Hello world', published: false });

    expect(res.status).toBe(201);
    expect(res.body.post).toMatchObject({
      title: 'My Post',
      content: 'Hello world',
      published: false,
    });
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'My Post', content: 'Hello world' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', user.cookie)
      .send({ content: 'No title here' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts/:postId', () => {
  it('returns a published post', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, {
      title: 'Public post',
      published: true,
    });

    const res = await request(app).get(`/api/posts/${post.id}`);

    expect(res.status).toBe(200);
    expect(res.body.post.id).toBe(post.id);
    expect(res.body.post.comments).toBeDefined();
  });

  it('returns 403 for an unpublished post accessed by a non-author', async () => {
    const author = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie, { published: false });

    const res = await request(app)
      .get(`/api/posts/${post.id}`)
      .set('Cookie', other.cookie);

    expect(res.status).toBe(403);
  });

  it('returns the post to the author even when unpublished', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: false });

    const res = await request(app)
      .get(`/api/posts/${post.id}`)
      .set('Cookie', user.cookie);

    expect(res.status).toBe(200);
  });

  it('returns 404 for a non-existent post', async () => {
    const res = await request(app).get('/api/posts/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/posts/:postId', () => {
  it('updates the post when the author makes the request', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie);

    const res = await request(app)
      .put(`/api/posts/${post.id}`)
      .set('Cookie', user.cookie)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe('Updated title');
  });

  it('returns 403 when another user tries to update the post', async () => {
    const author = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie);

    const res = await request(app)
      .put(`/api/posts/${post.id}`)
      .set('Cookie', other.cookie)
      .send({ title: 'Stolen title' });

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie);

    const res = await request(app)
      .put(`/api/posts/${post.id}`)
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent post', async () => {
    const user = await createUser();
    const res = await request(app)
      .put('/api/posts/99999')
      .set('Cookie', user.cookie)
      .send({ title: 'Ghost update' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/posts/:postId', () => {
  it('deletes the post and returns 204', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie);

    const res = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', user.cookie);

    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/posts/${post.id}`);
    expect(check.status).toBe(404);
  });

  it('returns 403 when another user tries to delete the post', async () => {
    const author = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie);

    const res = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', other.cookie);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie);

    const res = await request(app).delete(`/api/posts/${post.id}`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/posts/:postId/publish', () => {
  it('toggles the published state', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: false });

    const publish = await request(app)
      .post(`/api/posts/${post.id}/publish`)
      .set('Cookie', user.cookie);

    expect(publish.status).toBe(200);
    expect(publish.body.published).toBe(true);

    const unpublish = await request(app)
      .post(`/api/posts/${post.id}/publish`)
      .set('Cookie', user.cookie);

    expect(unpublish.body.published).toBe(false);
  });

  it('returns 403 when another user tries to toggle publish', async () => {
    const author = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie);

    const res = await request(app)
      .post(`/api/posts/${post.id}/publish`)
      .set('Cookie', other.cookie);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/posts/:postId/like', () => {
  it('likes a published post', async () => {
    const author = await createUser();
    const liker = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const res = await request(app)
      .post(`/api/posts/${post.id}/like`)
      .set('Cookie', liker.cookie);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
    expect(res.body.likes).toBe(1);
  });

  it('unlikes when the post is already liked', async () => {
    const author = await createUser();
    const liker = await createUser();
    const post = await createPost(author.cookie, { published: true });

    await request(app)
      .post(`/api/posts/${post.id}/like`)
      .set('Cookie', liker.cookie);

    const res = await request(app)
      .post(`/api/posts/${post.id}/like`)
      .set('Cookie', liker.cookie);

    expect(res.body.liked).toBe(false);
    expect(res.body.likes).toBe(0);
  });

  it('returns 403 when trying to like an unpublished post', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: false });

    const res = await request(app)
      .post(`/api/posts/${post.id}/like`)
      .set('Cookie', user.cookie);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: true });

    const res = await request(app).post(`/api/posts/${post.id}/like`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/posts/:postId/comments', () => {
  it('creates a comment on a published post', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const res = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('Great post!');
    expect(res.body.comment.author.username).toBe(commenter.username);
  });

  it('returns 401 when not authenticated', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: true });

    const res = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .send({ content: 'Anonymous comment' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when the post is unpublished', async () => {
    const user = await createUser();
    const post = await createPost(user.cookie, { published: false });

    const res = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', user.cookie)
      .send({ content: 'Sneaky comment' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when the post does not exist', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/posts/99999/comments')
      .set('Cookie', user.cookie)
      .send({ content: 'Ghost comment' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/posts/:postId/comments/:commentId', () => {
  it('updates a comment authored by the current user', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const commentRes = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'Original' });

    const commentId = commentRes.body.comment.id;

    const res = await request(app)
      .put(`/api/posts/${post.id}/comments/${commentId}`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.comment.content).toBe('Updated');
  });

  it('returns 403 when another user tries to update the comment', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const commentRes = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'Original' });

    const commentId = commentRes.body.comment.id;

    const res = await request(app)
      .put(`/api/posts/${post.id}/comments/${commentId}`)
      .set('Cookie', other.cookie)
      .send({ content: 'Hijacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/posts/:postId/comments/:commentId', () => {
  it('deletes a comment authored by the current user', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const commentRes = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'To be deleted' });

    const commentId = commentRes.body.comment.id;

    const res = await request(app)
      .delete(`/api/posts/${post.id}/comments/${commentId}`)
      .set('Cookie', commenter.cookie);

    expect(res.status).toBe(204);
  });

  it('returns 403 when another user tries to delete the comment', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const other = await createUser();
    const post = await createPost(author.cookie, { published: true });

    const commentRes = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Cookie', commenter.cookie)
      .send({ content: 'Mine' });

    const commentId = commentRes.body.comment.id;

    const res = await request(app)
      .delete(`/api/posts/${post.id}/comments/${commentId}`)
      .set('Cookie', other.cookie);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/posts/me', () => {
  it('returns all posts (published and draft) for the current user', async () => {
    const user = await createUser();
    await createPost(user.cookie, { title: 'Published', published: true });
    await createPost(user.cookie, { title: 'Draft', published: false });

    const res = await request(app).get('/api/posts/me').set('Cookie', user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(2);
  });

  it('does not return other users posts', async () => {
    const user = await createUser();
    const other = await createUser();
    await createPost(other.cookie, { published: true });

    const res = await request(app).get('/api/posts/me').set('Cookie', user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(0);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/posts/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/posts/authors/:authorId', () => {
  it('returns only published posts for the given author', async () => {
    const author = await createUser();
    await createPost(author.cookie, { title: 'Published', published: true });
    await createPost(author.cookie, { title: 'Draft', published: false });

    const res = await request(app).get(`/api/posts/authors/${author.id}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(author.id);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].title).toBe('Published');
  });

  it('returns 404 for a non-existent author', async () => {
    const res = await request(app).get('/api/posts/authors/99999');
    expect(res.status).toBe(404);
  });
});
