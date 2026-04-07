import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectService } from '../services/project.service.js';
import { tenantService } from '../services/tenant.service.js';

export async function projectsRouter(fastify: FastifyInstance) {
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

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const projects = await projectService.listProjects();
    return projects;
  });

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const projectWithSession = await projectService.getProjectWithSession(request.params.id);
      if (!projectWithSession) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      return projectWithSession;
    }
  );

  fastify.post<{
    Body: { name: string; path: string; userId?: string };
  }>('/', async (request, reply) => {
    const project = await projectService.createProject(request.body);
    const projectWithSession = await projectService.getProjectWithSession(project.id);
    return reply.status(201).send(projectWithSession);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await projectService.deleteProject(request.params.id);
      return reply.status(204).send();
    }
  );
}
