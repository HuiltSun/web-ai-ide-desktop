import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function chatRouter(fastify: FastifyInstance) {
  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/messages',
    async (request, reply) => {
      return [];
    }
  );
}
