import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function filesRouter(fastify: FastifyInstance) {
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/*',
    async (request, reply) => {
      return { error: 'Not implemented' };
    }
  );
}
