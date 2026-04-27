FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npx prisma generate && npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Server imports from dist/generated; seed-deploy.ts imports from src/generated
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 8000

CMD ["node", "dist/server.js"]
