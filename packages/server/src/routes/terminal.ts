import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ShellRegistry } from '../services/shellRegistry.js';
import type { TerminalMessage, CreateSessionPayload, InputPayload, ResizePayload } from '@web-ai-ide/shared';

let shellRegistry: ShellRegistry | null = null;

export function getShellRegistry(): ShellRegistry {
  if (!shellRegistry) {
    shellRegistry = new ShellRegistry();
  }
  return shellRegistry;
}

function generateSessionId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function send(socket: WebSocket, data: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export async function terminalRoutes(fastify: FastifyInstance): Promise<void> {
  const registry = getShellRegistry();
  const ptyService = registry.getPTYService();

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

  fastify.get('/ws/terminal', { websocket: true }, (socket, req) => {
    const socketSessions = new Set<string>();
    clientSessions.set(socket, socketSessions);

    socket.on('message', (data) => {
      try {
        const message: TerminalMessage = JSON.parse(data.toString());
        handleMessage(socket, message, registry, socketSessions);
      } catch (error) {
        send(socket, { type: 'error', payload: { error: 'Invalid message format' } });
      }
    });

    socket.on('close', () => {
      socketSessions.forEach((sessionId) => {
        try {
          registry.kill(sessionId, 'local');
        } catch {
        }
      });
      clientSessions.delete(socket);
    });

    socket.on('error', (error) => {
      fastify.log.error('WebSocket error:', error);
    });
  });

  async function handleMessage(
    socket: WebSocket,
    message: TerminalMessage,
    registry: ShellRegistry,
    socketSessions: Set<string>
  ): Promise<void> {
    switch (message.type) {
      case 'create': {
        const payload = message.payload as CreateSessionPayload;
        const newSessionId = generateSessionId();

        try {
          await registry.createSession(newSessionId, payload);
          socketSessions.add(newSessionId);
          send(socket, { type: 'created', sessionId: newSessionId, payload: { success: true } });
        } catch (error) {
          send(socket, {
            type: 'error',
            payload: { error: error instanceof Error ? error.message : 'Failed to create session' }
          });
        }
        break;
      }

      case 'input': {
        const payload = message.payload as InputPayload;
        if (payload.sessionId && payload.data) {
          registry.write(payload.sessionId, 'local', payload.data);
        }
        break;
      }

      case 'resize': {
        const payload = message.payload as ResizePayload;
        if (payload.sessionId) {
          registry.resize(payload.sessionId, 'local', payload.cols, payload.rows);
        }
        break;
      }

      case 'kill': {
        const payload = message.payload as { sessionId: string };
        if (payload.sessionId) {
          registry.kill(payload.sessionId, 'local');
          socketSessions.delete(payload.sessionId);
          send(socket, { type: 'exit', sessionId: payload.sessionId, payload: { sessionId: payload.sessionId, exitCode: 0 } });
        }
        break;
      }

      case 'list': {
        const sessions = registry.list('local');
        send(socket, { type: 'list', payload: { sessions } });
        break;
      }

      default:
        send(socket, { type: 'error', payload: { error: `Unknown message type: ${message.type}` } });
    }
  }
}
