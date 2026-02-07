# Project: Blog API - Server

## API

Base URL: `http://localhost:8000/api`

Notes:

- Auth uses a JWT stored in an HTTP-only cookie named `jwt`.
- Use curl `-c` to save cookies and `-b` to send them back.

### Auth

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

### Posts

List posts (paginated):

```bash
curl "http://localhost:8000/api/posts?page=1&limit=5"
```

Get a post by ID:

```bash
curl "http://localhost:8000/api/posts/1"
```

Create a post (auth required):

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"First post","published":true}'
```

Like/unlike a post (auth required):

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts/1/like
```

### Comments

Create a comment (auth required):

```bash
curl -i -b cookies.txt \
  -X POST http://localhost:8000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -d '{"content":"Nice post!"}'
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

## Generate a random secret using Node’s crypto module

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
