import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sessionService } from '../services/session.service.js';
import { tenantPlugin } from '../plugins/tenant.plugin.js';

export async function sessionsRouter(fastify: FastifyInstance) {
  await fastify.register(tenantPlugin);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { projectId: string } }>(
    '/project/:projectId',
    async (request, reply) => {
      const sessions = await sessionService.listSessions(request.params.projectId);
      return sessions;
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const session = await sessionService.getSession(request.params.id);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }
      return session;
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id/conversation',
    async (request, reply) => {
      const conversation = await sessionService.reconstructConversation(request.params.id);
      if (!conversation) {
        return reply.status(404).send({ error: 'Session not found' });
      }
      return conversation;
    }
  );

  fastify.post<{
    Body: { projectId: string; cwd?: string; gitBranch?: string; model?: string };
  }>('/', async (request, reply) => {
    const session = await sessionService.createSession(request.body);
    return reply.status(201).send(session);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await sessionService.deleteSession(request.params.id);
      return reply.status(204).send();
    }
  );
}