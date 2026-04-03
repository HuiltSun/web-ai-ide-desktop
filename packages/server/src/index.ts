import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { chatRouter } from './routes/chat.js';
import { filesRouter } from './routes/files.js';

const server = Fastify({
  logger: true,
});

await server.register(cors, { origin: true });
await server.register(websocket);

await server.register(projectsRouter, { prefix: '/api/projects' });
await server.register(sessionsRouter, { prefix: '/api/sessions' });
await server.register(chatRouter, { prefix: '/api/chat' });
await server.register(filesRouter, { prefix: '/api/files' });

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