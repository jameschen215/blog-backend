# Project: Blog API - Server

## API

Base URL: `http://localhost:8000/api`

Notes:

- Auth uses a JWT stored in an HTTP-only cookie named `jwt`.
- Use curl `-c` to save cookies and `-b` to send them back.
- In development, CORS allows `http://localhost:5173` unless `CLIENT_URL` is set.
- `POST /api/auth/login` and `POST /api/auth/register` are rate-limited.
- Most write routes require authentication through the `jwt` cookie.

### Auth

`POST /auth/register`

- Public route.
- Creates a new user, sets the `jwt` cookie, and returns the created user.
- Body:

```json
{
  "email": "user@example.com",
  "username": "user1",
  "password": "123456"
}
```

- Validation:
  - `email` must be valid
  - `username` must be 3 to 20 characters and only contain letters, numbers, `.`, `_`, `-`
  - `password` must be at least 6 characters
- Success: `201 Created`
- Common errors: `409` if email or username already exists

`POST /auth/login`

- Public route.
- Logs a user in, sets the `jwt` cookie, and returns the user.
- Body:

```json
{
  "username": "user1",
  "password": "123456"
}
```

- Validation:
  - `username` must be at least 3 characters
  - `password` must be at least 6 characters
- Success: `200 OK`
- Common errors: `401` for invalid credentials

`POST /auth/logout`

- Public route.
- Clears the `jwt` cookie.
- Success: `200 OK`

`GET /me`

- Auth required.
- Returns the currently authenticated user.
- Success: `200 OK`
- Common errors: `401` if the cookie is missing or invalid

### Posts

`GET /posts`

- Public route with optional auth.
- Returns paginated published posts.
- If the request includes a valid `jwt` cookie, the current user can also see their own unpublished posts in this list.
- Query params:
  - `page`: positive integer
  - `limit`: positive integer, max `50`
  - `search`: searches title and content
  - `sort`: `latest`, `likes`, or `comments`
- Success: `200 OK`

Example:

```bash
curl "http://localhost:8000/api/posts?page=1&limit=5&sort=latest&search=hello"
```

`GET /posts/me`

- Auth required.
- Returns all posts by the logged-in user, including drafts.
- Success: `200 OK`
- Common errors: `401` if not logged in

`GET /posts/authors/:authorId`

- Public route with optional auth.
- Returns posts for a specific author.
- If the requester is the same author, drafts are included.
- Params:
  - `authorId`: positive integer
- Success: `200 OK`
- Common errors: `404` if the user does not exist

`GET /posts/:postId`

- Public route with optional auth.
- Returns one post with full detail.
- Draft posts are only visible to their author.
- Params:
  - `postId`: positive integer
- Success: `200 OK`
- Common errors:
  - `403` if the post exists but is unpublished and you are not the author
  - `404` if the post does not exist

`POST /posts`

- Auth required.
- Creates a new post.
- Body:

```json
{
  "title": "Hello",
  "content": "First post",
  "published": true
}
```

- Validation:
  - `title` is required, trimmed, max `255` characters
  - `content` is required
  - `published` is optional and defaults to `false`
- Success: `201 Created`
- Common errors: `401` if not logged in

Example:

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"First post","published":true}'
```

`PUT /posts/:postId`

- Auth required.
- Updates one of your own posts.
- Params:
  - `postId`: positive integer
- Body:

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "published": false
}
```

- Validation:
  - At least one field must be provided
  - `title`, `content`, and `published` are all optional
- Success: `200 OK`
- Common errors:
  - `401` if not logged in
  - `403` if the post belongs to another user
  - `404` if the post does not exist

`DELETE /posts/:postId`

- Auth required.
- Deletes one of your own posts.
- Params:
  - `postId`: positive integer
- Success: `204 No Content`
- Common errors:
  - `401` if not logged in
  - `403` if the post belongs to another user
  - `404` if the post does not exist

`POST /posts/:postId/like`

- Auth required.
- Toggles like and unlike on a published post.
- Params:
  - `postId`: positive integer
- Success: `200 OK`
- Response includes:
  - `liked`: `true` if the post is now liked by the current user
  - `likes`: the updated like count
- Common errors:
  - `401` if not logged in
  - `403` if the post is unpublished
  - `404` if the post does not exist

`POST /posts/:postId/publish`

- Auth required.
- Toggles a post between published and unpublished.
- Params:
  - `postId`: positive integer
- Success: `200 OK`
- Response includes:
  - `published`: the new publish state
- Common errors:
  - `401` if not logged in
  - `403` if the post belongs to another user
  - `404` if the post does not exist

### Comments

All comment routes are nested under posts.

`POST /posts/:postId/comments`

- Auth required.
- Creates a comment on a published post.
- Params:
  - `postId`: positive integer
- Body:

```json
{
  "content": "Nice post!"
}
```

- Validation:
  - `content` is required, trimmed, max `500` characters
- Success: `201 Created`
- Common errors:
  - `401` if not logged in
  - `403` if the post is unpublished
  - `404` if the post does not exist

`PUT /posts/:postId/comments/:commentId`

- Auth required.
- Updates your own comment.
- Params:
  - `postId`: positive integer
  - `commentId`: positive integer
- Body:

```json
{
  "content": "Updated comment"
}
```

- Success: `200 OK`
- Common errors:
  - `401` if not logged in
  - `403` if the comment belongs to another user
  - `404` if the comment does not exist for that post

`DELETE /posts/:postId/comments/:commentId`

- Auth required.
- Deletes a comment.
- Allowed for:
  - the comment author
  - the post author
- Params:
  - `postId`: positive integer
  - `commentId`: positive integer
- Success: `204 No Content`
- Common errors:
  - `401` if not logged in
  - `403` if you are neither the comment author nor the post author
  - `404` if the comment does not exist for that post

### Curl examples

Register:

```bash
curl -i -c cookies.txt \
  -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"user1","password":"123456"}'
```

Login:

```bash
curl -i -c cookies.txt \
  -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456"}'
```

Logout:

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/auth/logout
```

Get current user:

```bash
curl -i -b cookies.txt \
  http://localhost:8000/api/me
```

Get my posts, including drafts:

```bash
curl -i -b cookies.txt \
  http://localhost:8000/api/posts/me
```

Get posts by author:

```bash
curl "http://localhost:8000/api/posts/authors/1"
```

Get a post by ID:

```bash
curl "http://localhost:8000/api/posts/1"
```

Update a post:

```bash
curl -i -b cookies.txt \
  -X PUT http://localhost:8000/api/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title"}'
```

Delete a post:

```bash
curl -i -b cookies.txt \
  -X DELETE http://localhost:8000/api/posts/1
```

Like or unlike a post:

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts/1/like
```

Toggle publish state:

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts/1/publish
```

Create a comment:

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -d '{"content":"Nice post!"}'
```

Update a comment:

```bash
curl -i -b cookies.txt \
  -X PUT http://localhost:8000/api/posts/1/comments/1 \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated comment"}'
```

Delete a comment:

```bash
curl -i -b cookies.txt \
  -X DELETE http://localhost:8000/api/posts/1/comments/1
```

## What I've learned

### CommonJS and ESM contradiction in Prisma

**SOLUTION**

1. Modify your `tsconfig.ts` like this:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "CommonJS",
    "lib": ["ESNext"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

2. Remove `"type": "module"` from `package.json`

3. Change all imports to remove `.js` extensions

```TypeScript
import authRoutes from './routes/auth.routes';  // Remove .js
```

### Generate a random secret using Node’s crypto module

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Server entrypoint lifecycle in `src/server.ts`

- Validate environment variables before starting the app so the process fails fast on bad config.
- Connect Prisma before calling `app.listen(...)` so the API does not accept requests when the database is unavailable.
- Keep the HTTP server instance in a shared variable so shutdown logic can close it gracefully.
- Use a `shuttingDown` guard to prevent cleanup from running multiple times.
- Handle `SIGINT`, `SIGTERM`, `unhandledRejection`, and `uncaughtException` by closing the server, disconnecting Prisma, and exiting with the correct status code.
- `SIGINT` is the interrupt signal, usually sent when I press `Ctrl + C` in the terminal to stop the app manually.
- `SIGTERM` is the terminate signal, usually sent by Docker, hosting platforms, or process managers when they want the app to shut down gracefully.
- `unhandledRejection` happens when a Promise rejects and nothing catches the error with `.catch(...)` or `try/catch` around `await`.
- `uncaughtException` happens when a normal synchronous error is thrown and nothing catches it, so it reaches the Node process level.
- Keep `app.ts` focused on middleware and routes, and keep `server.ts` focused on process lifecycle and startup/shutdown concerns.

### Validation middleware in `src/middleware/validate.ts`

- `validate(...)` is a middleware factory. It receives a Zod schema or a schema map, then returns the real Express middleware function.
- It supports two styles:
  - `validate(loginSchema)` means validate `req.body`
  - `validate({ params: postIdParamSchema, body: updatePostSchema })` means validate multiple request parts
- `isZodSchema(...)` is a type guard. It checks whether the input is one Zod schema or a `{ body, params, query }` object.
- `schema is ZodType` is not just a boolean return type. It tells TypeScript that if the function returns `true`, then `schema` should be treated as a `ZodType`.
- `MutableRequest` is a local helper type used to reassign `req.body`, `req.params`, and `req.query` after Zod parses them.
- `const mutableReq = req as MutableRequest;` is a TypeScript workaround so the middleware can replace raw request values with validated or coerced values.
- `req.validated ??= {}` means: if `req.validated` is `null` or `undefined`, initialize it as an empty object.
- The purpose of `req.validated ??= {}` is to make sure `req.validated.body`, `req.validated.params`, and `req.validated.query` can be assigned safely.
- `parseAsync(...)` validates and parses request data. If the schema uses coercion, the parsed value can differ from the original input.
- After parsing, the middleware writes the parsed values back onto the request object and also stores them in `req.validated`.
- This means controllers can work with already-validated data instead of repeating validation logic.
- `as Request['params']` means: treat the parsed value as the same type as Express request params.
- `Request['params']` is indexed access syntax in TypeScript. It means “the type of the `params` property on `Request`”.
- The same idea is used with `Request['query']`.
- If Zod throws a `ZodError`, the middleware returns `400 Bad Request` with formatted validation errors.
- If some other unexpected error happens, it calls `next(error)` so the global error handler can handle it.

### Docker

To deploy, follow these steps:

1. Install flyctl
   brew install flyctl

2. Log in
   fly auth login

3. Register the app (uses your fly.toml, skips the guided setup)
   fly launch --no-deploy

4. Set your Neon production DATABASE_URL as a secret
   fly secrets set DATABASE_URL="postgresql://..."

5. Set the JWT secret (must be 32+ chars)
   fly secrets set SECRET_KEY="your-production-secret-key-here"

6. Optionally set your frontend URL for CORS
   fly secrets set CLIENT_URL="https://your-frontend.com"

7. Deploy
   fly deploy
   unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && fly deploy
