import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { chatRouter } from './routes/chat.js';
import { filesRouter } from './routes/files.js';
import { authRouter } from './routes/auth.js';

const server = Fastify({
  logger: true,
});

await server.register(cors, { origin: true });
await server.register(websocket);
await server.register(jwt, { secret: process.env.JWT_SECRET || 'web-ai-ide-secret-key-change-in-production' });

server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

await server.register(projectsRouter, { prefix: '/api/projects' });
await server.register(sessionsRouter, { prefix: '/api/sessions' });
await server.register(chatRouter, { prefix: '/api/chat' });
await server.register(filesRouter, { prefix: '/api/files' });
await server.register(authRouter, { prefix: '/api/auth' });

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export { server };