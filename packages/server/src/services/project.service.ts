import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DEFAULT_USER_ID = 'default-user';

async function ensureDefaultUser() {
  const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    return prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'default@webaiide.local',
        name: 'Default User',
        password: hashedPassword,
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
    const project = await prisma.project.create({
      data: {
        name: data.name,
        path: data.path,
        userId: data.userId || user.id,
      },
    });

    await prisma.session.create({
      data: {
        projectId: project.id,
        model: 'gpt-4o',
      },
    });

    return project;
  },

  async getProjectWithSession(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project || project.sessions.length === 0) {
      return null;
    }

    return {
      project,
      session: project.sessions[0],
    };
  },

  async deleteProject(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};