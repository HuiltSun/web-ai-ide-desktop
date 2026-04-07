import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tenantService } from '../services/tenant.service.js';

export async function filesRouter(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      const tenant = await tenantService.getTenantByApiKey(apiKey);
      if (tenant) {
        await tenantService.setSearchPath(tenant.schema);
      }
    }
  });

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/*',
    async (request, reply) => {
      return { error: 'Not implemented' };
    }
  );
}
