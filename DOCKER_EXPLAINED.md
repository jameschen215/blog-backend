# Dockerfile & fly.toml Explained

## Dockerfile

A Dockerfile is a recipe that tells Docker how to build a container image for your app. Think of a container as a lightweight, isolated box that contains your app and everything it needs to run — Node.js, dependencies, compiled code — so it runs the same everywhere.

This project uses a **multi-stage build**, meaning the Dockerfile has two separate stages. The first stage builds the app, and the second stage creates the final lean image that actually runs in production. This keeps the production image small by leaving behind all the build tools.

---

### Stage 1: Builder

```dockerfile
FROM node:22-alpine AS builder
```

Start from an official Node.js 22 image based on Alpine Linux (a very small Linux distro, ~5MB). This becomes the base environment. We name this stage `builder`.

```dockerfile
WORKDIR /app
```

Set `/app` as the working directory inside the container. All subsequent commands run from here.

```dockerfile
COPY package*.json ./
COPY prisma ./prisma/
```

Copy only the files needed to install dependencies first. We do this _before_ copying source code so Docker can cache the `npm ci` step — if your source changes but `package.json` doesn't, Docker skips re-installing all packages.

```dockerfile
RUN npm ci
```

Install all dependencies (including devDependencies like TypeScript and tsx). `npm ci` is like `npm install` but faster and stricter — it uses `package-lock.json` exactly, which is important for reproducible builds.

```dockerfile
COPY tsconfig.json ./
COPY src ./src/
```

Now copy the TypeScript source files. We copy these _after_ `npm ci` to preserve the cache benefit above.

```dockerfile
RUN npx prisma generate && npm run build
```

Two things happen here:

- `prisma generate` reads `prisma/schema.prisma` and generates the Prisma client (the JavaScript code that lets your app talk to the database). Output goes to `src/generated/prisma/`.
- `npm run build` runs `tsc` (TypeScript compiler), which compiles all your `.ts` files in `src/` into plain JavaScript in `dist/`.

---

### Stage 2: Runner (the actual production image)

```dockerfile
FROM node:22-alpine
```

Start fresh from the same base image. Everything from the builder stage is left behind unless we explicitly copy it.

```dockerfile
WORKDIR /app
ENV NODE_ENV=production
```

Same working directory. Set `NODE_ENV=production` so Express and other libraries know to run in production mode (better performance, less logging).

```dockerfile
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
```

Copy config files needed at runtime — `prisma.config.ts` is used by the `prisma migrate deploy` release command.

```dockerfile
COPY --from=builder /app/node_modules ./node_modules
```

Copy the already-installed `node_modules` from the builder stage. This includes all deps — production and dev — because we need `prisma` CLI and `tsx` for the release command.

```dockerfile
COPY --from=builder /app/dist ./dist
```

Copy the compiled JavaScript output from the builder.

```dockerfile
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/src/generated ./src/generated
```

Copy the Prisma-generated client to two locations:

- `dist/generated/` — used by the compiled server (`dist/lib/prisma.js` looks here at runtime)
- `src/generated/` — used by `prisma/seed-deploy.ts` which runs via `tsx` and resolves paths relative to `src/`

```dockerfile
EXPOSE 8000
```

Document that the container listens on port 8000. This is informational — it doesn't actually open the port, but fly.io reads it.

```dockerfile
CMD ["node", "dist/server.js"]
```

The command that runs when the container starts. This launches your compiled Express server.

---

## fly.toml

`fly.toml` is the configuration file for fly.io. It tells fly.io how to run, scale, and expose your app.

```toml
app = 'blog-backend-young-violet-1501'
primary_region = 'iad'
```

Your app's unique name on fly.io and the primary data center region (`iad` = Northern Virginia). Fly.io runs your container here.

```toml
[build]
```

Tells fly.io to build using the `Dockerfile` in the project root. No extra options needed.

```toml
[deploy]
  release_command = 'npx prisma migrate deploy && npx tsx prisma/seed-deploy.ts'
```

A command that runs _before_ your new version goes live on every deploy. It:

1. Runs any pending database migrations against the production Neon database
2. Seeds the admin user James (using `upsert`, so it's safe to run repeatedly)

If this command fails, the deploy is cancelled and the old version stays live — protecting you from deploying broken code against a migrated database.

```toml
[env]
  NODE_ENV = 'production'
  PORT = '8000'
```

Environment variables baked into every machine. Secrets (like `DATABASE_URL` and `SECRET_KEY`) are set separately via `fly secrets set` and are never stored in this file.

```toml
[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
```

- `internal_port` — the port your Express app listens on inside the container
- `force_https` — fly.io handles SSL termination and redirects HTTP → HTTPS automatically
- `auto_stop_machines` / `auto_start_machines` — the machine shuts down when there's no traffic and wakes up on the next request (saves cost on a hobby app)
- `min_machines_running = 0` — allows scaling to zero when idle

```toml
[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1
```

The size of the virtual machine running your container. 256MB RAM with 1 shared CPU is the smallest tier — fine for a low-traffic API.
