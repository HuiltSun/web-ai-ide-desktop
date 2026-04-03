import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sessionService = {
  async createSession(projectId: string, model: string) {
    return prisma.session.create({
      data: { projectId, model },
    });
  },

  async getSession(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: true,
      },
    });
  },

  async getSessionWithMessages(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async listSessions(projectId: string) {
    return prisma.session.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            role: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  },

  async addMessage(
    sessionId: string,
    role: string,
    content: string,
    toolCalls?: unknown
  ) {
    return prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        toolCalls: toolCalls || undefined,
      },
    });
  },

  async getMessages(sessionId: string) {
    return prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async updateSessionModel(sessionId: string, model: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { model },
    });
  },

  async deleteSession(id: string) {
    return prisma.session.delete({ where: { id } });
  },

  async deleteSessionMessages(sessionId: string) {
    return prisma.message.deleteMany({
      where: { sessionId },
    });
  },
};
