FROM node:20.18.0-alpine3.20

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nodejs:nodejs ./src ./src

USER nodejs

CMD ["node", "src/index.js"]
