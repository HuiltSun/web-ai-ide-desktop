FROM node:20.18.0-alpine3.19

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY --chown=nodejs:nodejs . .

USER nodejs

CMD ["npm", "run", "start"]
