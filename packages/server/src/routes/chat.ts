import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { sessionService } from '../services/session.service.js';
import { tenantService } from '../services/tenant.service.js';

interface ChatMessage {
  type: 'message' | 'approve' | 'reject';
  content?: string;
  toolCallId?: string;
}

interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
}

export async function chatRouter(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      const tenant = await tenantService.getTenantByApiKey(apiKey);
      if (tenant) {
        await tenantService.setSearchPath(tenant.schema);
      }
    }
  });

  // REST 端点需要认证
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/messages',
    async (request, reply) => {
      const messages = await sessionService.getMessages(request.params.sessionId);
      return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }
  );

  // WebSocket 端点 - 认证需要在连接建立后通过消息传递
  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/stream',
    { websocket: true },
    async (socket, request) => {
      const sessionId = request.params.sessionId;
      fastify.log.info(`WebSocket connected for session: ${sessionId}`);

      let streamingContent = '';
      let activeSessionId = sessionId;
      let sessionReady = false;

      try {
        const existingSession = await sessionService.getSession(sessionId);
        if (existingSession) {
          activeSessionId = existingSession.id;
          sessionReady = true;
          fastify.log.info(`Using existing session: ${activeSessionId}`);
        } else {
          const sessionByProject = await sessionService.getSessionByProject(sessionId);
          if (sessionByProject) {
            activeSessionId = sessionByProject.id;
            sessionReady = true;
            fastify.log.info(`Found session ${activeSessionId} by projectId: ${sessionId}`);
          } else {
            fastify.log.warn(`Session not found for: ${sessionId}. Creating new session.`);
            const newSession = await sessionService.createSession({
              projectId: sessionId,
            });
            activeSessionId = newSession.id;
            sessionReady = true;
            fastify.log.info(`Created new session: ${activeSessionId} for project: ${sessionId}`);
          }
        }
      } catch (err) {
        fastify.log.error({ err }, 'Failed to check session:');
        socket.send(JSON.stringify({
          type: 'error',
          content: 'Failed to initialize session. Please try again.',
        } as ChatStreamEvent));
        socket.close();
        return;
      }

      socket.on('message', async (message: Buffer) => {
        if (!sessionReady) {
          socket.send(JSON.stringify({
            type: 'error',
            content: 'Session not ready.',
          } as ChatStreamEvent));
          return;
        }

        try {
          const data: ChatMessage = JSON.parse(message.toString());

          if (data.type === 'message' && data.content) {
            try {
              await sessionService.addMessage({
                sessionId: activeSessionId,
                uuid: crypto.randomUUID(),
                type: 'user',
                role: 'user',
                content: data.content,
              });
            } catch (dbError) {
              fastify.log.error({ err: dbError }, 'Database error adding message:');
              socket.send(JSON.stringify({
                type: 'error',
                content: 'Failed to save message.',
              } as ChatStreamEvent));
              return;
            }

            socket.send(JSON.stringify({
              type: 'text',
              content: 'AI response simulation - Configure AI provider to enable real responses',
            } as ChatStreamEvent));

            streamingContent += 'This is a simulated AI response. Configure your AI provider to enable real responses.\n\n';
            streamingContent += 'You said: ' + data.content;

            socket.send(JSON.stringify({
              type: 'done',
            } as ChatStreamEvent));

          } else if (data.type === 'approve' && data.toolCallId) {
            fastify.log.info(`Tool approved: ${data.toolCallId}`);
            socket.send(JSON.stringify({
              type: 'text',
              content: `Tool ${data.toolCallId} approved`,
            } as ChatStreamEvent));

          } else if (data.type === 'reject' && data.toolCallId) {
            fastify.log.info(`Tool rejected: ${data.toolCallId}`);
            socket.send(JSON.stringify({
              type: 'text',
              content: `Tool ${data.toolCallId} rejected`,
            } as ChatStreamEvent));
          }
        } catch (error) {
          fastify.log.error({ err: error }, 'Error processing message:');
          socket.send(JSON.stringify({
            type: 'error',
            content: error instanceof Error ? error.message : 'Failed to process message',
          } as ChatStreamEvent));
        }
      });

      socket.on('close', () => {
        fastify.log.info(`WebSocket disconnected for session: ${sessionId}`);
      });

      socket.on('error', (error: Error) => {
        fastify.log.error({ err: error }, `WebSocket error for session ${sessionId}:`);
      });
    }
  );
}