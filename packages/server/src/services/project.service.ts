import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const projectService = {
  async listProjects() {
    return prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getProject(id: string) {
    return prisma.project.findUnique({ where: { id } });
  },

  async createProject(data: { name: string; path: string; userId: string }) {
    return prisma.project.create({ data });
  },

  async deleteProject(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
