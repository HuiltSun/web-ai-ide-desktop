import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_USER_ID = 'default-user';

async function ensureDefaultUser() {
  const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || crypto.randomUUID();
    return prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'default@webaiide.local',
        name: 'Default User',
        password: defaultPassword,
      },
    });
  }
  return user;
}

export const projectService = {
  async listProjects() {
    return prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getProject(id: string) {
    return prisma.project.findUnique({ where: { id } });
  },

  async createProject(data: { name: string; path: string; userId?: string }) {
    const user = await ensureDefaultUser();
    return prisma.project.create({
      data: {
        name: data.name,
        path: data.path,
        userId: data.userId || user.id,
      },
    });
  },

  async deleteProject(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};