import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ptyService } from '../services/pty.service.js';

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

  ptyService.on('output', ({ sessionId, data }: { sessionId: string; data: string }) => {
    clientSessions.forEach((sessions, socket) => {
      if (sessions.has(sessionId)) {
        send(socket, { type: 'output', sessionId, payload: { sessionId, data } });
      }
    });
  });

  ptyService.on('exit', ({ sessionId, exitCode }: { sessionId: string; exitCode: number }) => {
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
          ptyService.kill(sessionId, 'openclaude');
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

        const result = ptyService.createOpenClaudeSession(
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
          ptyService.write(payload.sessionId, 'openclaude', payload.data);
        }
        break;
      }

      case 'resize': {
        const payload = message.payload as ResizePayload;
        if (payload.sessionId) {
          ptyService.resize(payload.sessionId, 'openclaude', payload.cols, payload.rows);
        }
        break;
      }

      case 'kill': {
        const payload = message.payload as { sessionId: string };
        if (payload.sessionId) {
          ptyService.kill(payload.sessionId, 'openclaude');
          socketSessions.delete(payload.sessionId);
          send(socket, { type: 'exit', sessionId: payload.sessionId, payload: { sessionId: payload.sessionId, exitCode: 0 } });
        }
        break;
      }

      case 'list': {
        const sessions = ptyService.list('openclaude');
        send(socket, { type: 'list', payload: { sessions } });
        break;
      }

      default:
        send(socket, { type: 'error', payload: { error: `Unknown message type: ${message.type}` } });
    }
  }
}
