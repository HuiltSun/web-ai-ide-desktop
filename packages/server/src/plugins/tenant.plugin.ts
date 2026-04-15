import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tenantService } from '../services/tenant.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    tenantSchema?: string;
  }
}

export async function tenantPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest('tenantId', '');
  fastify.decorateRequest('tenantSchema', '');

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      return;
    }

    try {
      const tenant = await tenantService.getTenantByApiKey(apiKey);
      if (tenant) {
        request.tenantId = tenant.id;
        request.tenantSchema = tenant.schema;
        await tenantService.setSearchPath(tenant.schema);
      }
    } catch (error) {
      fastify.log.error({ err: error }, 'Tenant plugin error:');
    }
  });
}
