import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SessionListItem {
  sessionId: string;
  cwd: string | null;
  startTime: string;
  prompt: string;
  gitBranch: string | null;
  messageCount: number;
}

export interface ConversationRecord {
  sessionId: string;
  projectId: string;
  startTime: string;
  lastUpdated: string;
  messages: Array<{
    uuid: string;
    parentUuid: string | null;
    type: string;
    subtype: string | null;
    role: string;
    content: string;
    toolCalls: unknown | null;
    toolCallResult: unknown | null;
    usageMetadata: unknown | null;
    model: string | null;
    systemPayload: unknown | null;
  }>;
}

export const sessionService = {
  async createSession(data: {
    projectId: string;
    cwd?: string;
    gitBranch?: string;
    model?: string;
  }) {
    return prisma.session.create({
      data: {
        projectId: data.projectId,
        cwd: data.cwd,
        gitBranch: data.gitBranch,
        model: data.model || 'gpt-4o',
      },
    });
  },

  async getSessionByProject(projectId: string) {
    const sessions = await prisma.session.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });
    return sessions[0] || null;
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

  async listSessions(projectId: string) {
    const sessions = await prisma.session.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
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

    return sessions.map((session) => ({
      sessionId: session.id,
      cwd: session.cwd,
      startTime: session.createdAt.toISOString(),
      prompt: session.messages[0]?.content?.slice(0, 200) || '',
      gitBranch: session.gitBranch,
      messageCount: session._count.messages,
    }));
  },

  async reconstructConversation(sessionId: string): Promise<ConversationRecord | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) return null;

    return {
      sessionId: session.id,
      projectId: session.projectId,
      startTime: session.createdAt.toISOString(),
      lastUpdated: session.updatedAt.toISOString(),
      messages: session.messages.map((msg) => ({
        uuid: msg.uuid,
        parentUuid: msg.parentUuid,
        type: msg.type,
        subtype: msg.subtype,
        role: msg.role,
        content: msg.content,
        toolCalls: msg.toolCalls,
        toolCallResult: msg.toolCallResult,
        usageMetadata: msg.usageMetadata,
        model: msg.model,
        systemPayload: msg.systemPayload,
      })),
    };
  },

  async addMessage(data: {
    sessionId: string;
    uuid: string;
    parentUuid?: string;
    type: string;
    subtype?: string;
    role: string;
    content: string;
    toolCalls?: unknown;
    toolCallResult?: unknown;
    usageMetadata?: unknown;
    model?: string;
    systemPayload?: unknown;
  }) {
    return prisma.message.create({
      data: {
        sessionId: data.sessionId,
        uuid: data.uuid,
        parentUuid: data.parentUuid,
        type: data.type,
        subtype: data.subtype,
        role: data.role,
        content: data.content,
        toolCalls: data.toolCalls || undefined,
        toolCallResult: data.toolCallResult || undefined,
        usageMetadata: data.usageMetadata || undefined,
        model: data.model,
        systemPayload: data.systemPayload || undefined,
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