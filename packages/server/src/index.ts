import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { chatRouter } from './routes/chat.js';
import { filesRouter } from './routes/files.js';
import { authRouter } from './routes/auth.js';
import { RedisClient, redis } from './utils/redis.js';
import { rabbitmq } from './utils/rabbitmq.js';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, `server-${process.pid}-${Date.now()}.log`);

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function writeToFile(message: string) {
  try {
    appendFileSync(LOG_FILE, `${message}\n`);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

server.addHook('onRequest', async (request, reply) => {
  (request as any).startTime = Date.now();
});

if (process.env.NODE_ENV === 'production') {
  server.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;
    const logMsg = `${new Date().toISOString()} [${reply.statusCode >= 400 ? 'ERROR' : 'INFO'}] ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`;
    server.log.info({ method: request.method, url: request.url, statusCode: reply.statusCode, duration: `${duration}ms` });
    writeToFile(logMsg);
  });

  server.addHook('onError', async (request, reply, error) => {
    const logMsg = `${new Date().toISOString()} [ERROR] ${request.method} ${request.url} - ${error.message}`;
    server.log.error({ method: request.method, url: request.url, error: error.message, stack: error.stack });
    writeToFile(logMsg);
  });
} else {
  server.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;
    const logMsg = `${new Date().toISOString()} [${reply.statusCode >= 400 ? 'ERROR' : 'INFO'}] ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`;
    writeToFile(logMsg);
  });

  server.addHook('onError', async (request, reply, error) => {
    const logMsg = `${new Date().toISOString()} [ERROR] ${request.method} ${request.url} - ${error.message}`;
    writeToFile(logMsg);
  });
}

await server.register(cors, { origin: true });
await server.register(websocket);
await server.register(jwt, { secret: process.env.JWT_SECRET || 'web-ai-ide-secret-key-change-in-production' });

server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

await server.register(projectsRouter, { prefix: '/api/projects' });
await server.register(sessionsRouter, { prefix: '/api/sessions' });
await server.register(chatRouter, { prefix: '/api/chat' });
await server.register(filesRouter, { prefix: '/api/files' });
await server.register(authRouter, { prefix: '/api/auth' });

const start = async () => {
  try {
    const startMsg = `${new Date().toISOString()} [INFO] Starting Web AI IDE Server...`;
    server.log.info('Starting Web AI IDE Server...');
    server.log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    server.log.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
    writeToFile(startMsg);
    await server.listen({ port: 3001, host: '0.0.0.0' });
    const listenMsg = `${new Date().toISOString()} [INFO] Server listening at http://0.0.0.0:3001`;
    server.log.info('Server listening at http://0.0.0.0:3001');
    writeToFile(listenMsg);
  } catch (err) {
    const errorMsg = `${new Date().toISOString()} [ERROR] Failed to start server - ${err}`;
    server.log.error(err, 'Failed to start server');
    writeToFile(errorMsg);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await server.close();
  await RedisClient.close();
  await rabbitmq.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await server.close();
  await RedisClient.close();
  await rabbitmq.close();
  process.exit(0);
});

export { server };