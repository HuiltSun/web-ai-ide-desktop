import { redis } from '../utils/redis.js';

interface SessionCache {
  id: string;
  tenantId: string;
  userId: string;
  projectId: string;
  cursor: string;
  context: any[];
  provider: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24;

export const sessionCacheService = {
  async getSession(sessionId: string): Promise<SessionCache | null> {
    try {
      const data = await redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getSession error:', error);
      return null;
    }
  },

  async setSession(sessionId: string, session: SessionCache): Promise<void> {
    try {
      await redis.setex(
        `session:${sessionId}`,
        SESSION_TTL,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Redis setSession error:', error);
    }
  },

  async updateSession(sessionId: string, updates: Partial<SessionCache>): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.setSession(sessionId, updated);
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Redis deleteSession error:', error);
    }
  },

  async addMessageToContext(sessionId: string, message: any): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.context.push(message);
      if (session.context.length > 50) {
        session.context = session.context.slice(-50);
      }
      await this.setSession(sessionId, session);
    }
  },
};
