# Fly.io Deployment

## App

- **App name:** `blog-backend-young-violet-1501`
- **Region:** `iad` (Northern Virginia — matches Neon database region)
- **Platform:** [fly.io](https://fly.io)
- **Database:** Neon (production branch)

## First-time setup

```bash
# 1. Install flyctl
brew install flyctl

# 2. Log in
fly auth login

# 3. Register the app
fly launch --no-deploy

# 4. Set secrets
fly secrets set DATABASE_URL="your-neon-production-connection-string"
fly secrets set SECRET_KEY="your-secret-key-32-chars-minimum"
fly secrets set CLIENT_URL="https://your-frontend.com"

# 5. Deploy (unset proxy first if on a proxied network)
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && fly deploy
```

## Deploying updates

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && fly deploy
```

Migrations run automatically via the `release_command` in `fly.toml` before each deploy goes live.

## Seeding the admin user (James)

The release command attempts to seed automatically, but if it doesn't run or you need to re-seed manually, run this locally from the project root:

```bash
DATABASE_URL="your-neon-production-connection-string" npx tsx prisma/seed-deploy.ts
```

This runs `seed-deploy.ts` against the production Neon database directly. It uses `upsert`, so it's safe to run multiple times — it won't create duplicates or delete any data.

## Checking logs

```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && fly logs -a blog-backend-young-violet-1501
```
