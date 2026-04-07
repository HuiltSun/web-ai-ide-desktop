# Multi-stage build for reduced image size
FROM node:20.18.0-alpine3.20 AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
COPY package.json package-lock.json* turbo.json tsconfig.json ./
COPY packages/*/package.json packages/
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --chown=nodejs:nodejs --from=builder /app/packages/cli/dist ./dist
EXPOSE 3000
USER nodejs
CMD ["sh", "-c", "echo 'Run: docker-compose up -d'"]
