FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS builder
COPY package.json package-lock.json* turbo.json tsconfig.json ./
COPY packages/*/package.json packages/
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/packages/cli/dist ./dist
EXPOSE 3000
CMD ["echo", 'Run: docker-compose up -d']
