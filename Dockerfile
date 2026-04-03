# Multi-stage build for reduced image size
# Note: Base image vulnerabilities are inherited from Node.js official images
# For production, consider using distroless images or specific version tags
FROM node:20.18.0-alpine3.20 AS base
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
CMD ["sh", "-c", "echo 'Run: docker-compose up -d'"]