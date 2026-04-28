import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { buildUserData, createUser } from './helpers';

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with token', async () => {
    const data = buildUserData();
    const res = await request(app).post('/api/auth/register').send(data);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      username: data.username,
      email: data.email,
      role: 'USER',
    });
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    const data = buildUserData();
    await request(app).post('/api/auth/register').send(data);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...data, username: 'differentUser' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });

  it('returns 409 when username is already taken', async () => {
    const data = buildUserData();
    await request(app).post('/api/auth/register').send(data);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...data, email: 'different@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/username/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(buildUserData({ email: 'not-an-email' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for username with invalid characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(buildUserData({ username: 'bad user!' }));

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    const data = buildUserData();
    await request(app).post('/api/auth/register').send(data);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: data.username, password: data.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(data.username);
  });

  it('returns 401 for wrong password', async () => {
    const data = buildUserData();
    await request(app).post('/api/auth/register').send(data);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: data.username, password: 'wrongPassword' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'someone' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/me', () => {
  it('returns the current user when authenticated', async () => {
    const user = await createUser();
    const res = await request(app).get('/api/me').set('Cookie', user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', 'jwt=invalid.token.here');
    expect(res.status).toBe(401);
  });
});
