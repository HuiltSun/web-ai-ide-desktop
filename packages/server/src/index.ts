import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { chatRouter } from './routes/chat.js';
import { filesRouter } from './routes/files.js';
import { authRouter } from './routes/auth.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

server.addHook('onRequest', async (request, reply) => {
  (request as any).startTime = Date.now();
});

server.addHook('onResponse', async (request, reply) => {
  const startTime = (request as any).startTime || Date.now();
  const duration = Date.now() - startTime;
  server.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
    ip: request.ip,
  });
});

server.addHook('onError', async (request, reply, error) => {
  server.log.error({
    method: request.method,
    url: request.url,
    error: error.message,
    stack: error.stack,
  });
});

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
    server.log.info('Starting Web AI IDE Server...');
    server.log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    server.log.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
    await server.listen({ port: 3001, host: '0.0.0.0' });
    server.log.info('Server listening at http://0.0.0.0:3001');
  } catch (err) {
    server.log.error(err, 'Failed to start server');
    process.exit(1);
  }
};

start();

export { server };