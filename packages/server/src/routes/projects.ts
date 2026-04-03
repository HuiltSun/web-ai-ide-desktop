import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectService } from '../services/project.service.js';

export async function projectsRouter(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const projects = await projectService.listProjects();
    return projects;
  });

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const project = await projectService.getProject(request.params.id);
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      return project;
    }
  );

  fastify.post<{
    Body: { name: string; path: string; userId: string };
  }>('/', async (request, reply) => {
    const project = await projectService.createProject(request.body);
    return reply.status(201).send(project);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await projectService.deleteProject(request.params.id);
      return reply.status(204).send();
    }
  );
}
