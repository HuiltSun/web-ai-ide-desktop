import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ptyManager } from '../services/pty-manager.js';

interface PTYMessage {
  type: 'create' | 'input' | 'resize' | 'kill' | 'list';
  payload?: any;
  sessionId?: string;
}

interface CreatePayload {
  cols?: number;
  rows?: number;
}

interface InputPayload {
  sessionId: string;
  data: string;
}

interface ResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

function generateSessionId(): string {
  return `oc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function send(socket: WebSocket, data: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export async function ptyRoutes(fastify: FastifyInstance): Promise<void> {
  const clientSessions = new Map<WebSocket, Set<string>>();

  ptyManager.on('output', ({ sessionId, data }: { sessionId: string; data: string }) => {
    clientSessions.forEach((sessions, socket) => {
      if (sessions.has(sessionId)) {
        send(socket, { type: 'output', sessionId, payload: { sessionId, data } });
      }
    });
  });

  ptyManager.on('exit', ({ sessionId, exitCode }: { sessionId: string; exitCode: number }) => {
    clientSessions.forEach((sessions, socket) => {
      if (sessions.has(sessionId)) {
        send(socket, { type: 'exit', sessionId, payload: { sessionId, exitCode } });
        sessions.delete(sessionId);
      }
    });
  });

  fastify.get('/ws/pty', { websocket: true }, (socket, req) => {
    const socketSessions = new Set<string>();
    clientSessions.set(socket, socketSessions);

    socket.on('message', (data) => {
      try {
        const message: PTYMessage = JSON.parse(data.toString());
        handleMessage(socket, message, socketSessions);
      } catch (error) {
        send(socket, { type: 'error', payload: { error: 'Invalid message format' } });
      }
    });

    socket.on('close', () => {
      socketSessions.forEach((sessionId) => {
        try {
          ptyManager.kill(sessionId);
        } catch {
        }
      });
      clientSessions.delete(socket);
    });

    socket.on('error', (error) => {
      fastify.log.error({ err: error }, 'WebSocket error');
    });
  });

  function handleMessage(
    socket: WebSocket,
    message: PTYMessage,
    socketSessions: Set<string>
  ): void {
    switch (message.type) {
      case 'create': {
        const payload = message.payload as CreatePayload;
        const newSessionId = generateSessionId();

        const result = ptyManager.createOpenClaudeSession(
          newSessionId,
          payload?.cols || 80,
          payload?.rows || 24
        );

        if (result.success) {
          socketSessions.add(newSessionId);
          send(socket, { type: 'created', sessionId: newSessionId, payload: { success: true } });
        } else {
          send(socket, { type: 'error', payload: { error: result.error || 'Failed to create session' } });
        }
        break;
      }

      case 'input': {
        const payload = message.payload as InputPayload;
        if (payload.sessionId && payload.data) {
          ptyManager.write(payload.sessionId, payload.data);
        }
        break;
      }

      case 'resize': {
        const payload = message.payload as ResizePayload;
        if (payload.sessionId) {
          ptyManager.resize(payload.sessionId, payload.cols, payload.rows);
        }
        break;
      }

      case 'kill': {
        const payload = message.payload as { sessionId: string };
        if (payload.sessionId) {
          ptyManager.kill(payload.sessionId);
          socketSessions.delete(payload.sessionId);
          send(socket, { type: 'exit', sessionId: payload.sessionId, payload: { sessionId: payload.sessionId, exitCode: 0 } });
        }
        break;
      }

      case 'list': {
        const sessions = ptyManager.list();
        send(socket, { type: 'list', payload: { sessions } });
        break;
      }

      default:
        send(socket, { type: 'error', payload: { error: `Unknown message type: ${message.type}` } });
    }
  }
}