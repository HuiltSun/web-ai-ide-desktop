import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { sessionService } from '../services/session.service.js';
import { AgentProcessManager } from '../services/agent-process-manager.js';
import { AgentSessionManager } from '../services/agent-session-manager.js';
import type { ProviderConfig } from '../services/agent-process-manager.js';
import { sanitizeWorkingDirectory } from '../services/tool-whitelist.js';
import { tenantPlugin } from '../plugins/tenant.plugin.js';
import { prisma } from '../utils/prisma.js';
import {
  mapProviderIdToType,
  getDefaultProviderConfig,
  isValidSuperpowerConfig,
  SuperpowerConfig,
} from '../constants/provider.js';

const processManager = new AgentProcessManager();
const sessionManager = new AgentSessionManager(processManager);

interface ChatMessage {
  type: 'message' | 'approve' | 'reject' | 'user_confirm';
  content?: string;
  toolCallId?: string;
  promptId?: string;
  approved?: boolean;
}

interface UserConfirmMessage {
  type: 'user_confirm';
  promptId: string;
  approved: boolean;
}

function isUserConfirmMessage(data: ChatMessage): data is UserConfirmMessage {
  return (
    data.type === 'user_confirm' &&
    typeof data.promptId === 'string' &&
    data.promptId.trim() !== ''
  );
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
  await fastify.register(tenantPlugin);

  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/messages',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const messages = await sessionService.getMessages(request.params.sessionId);
      return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }
  );

  fastify.get<{ Params: { sessionId: string }; Querystring: { token?: string } }>(
    '/:sessionId/stream',
    { websocket: true },
    async (socket, request) => {
      const token = request.query.token;

      if (token) {
        try {
          await fastify.jwt.verify(token);
        } catch (err) {
          fastify.log.warn('WebSocket auth failed');
          socket.send(JSON.stringify({
            type: 'error',
            content: 'Unauthorized',
          } as ChatStreamEvent));
          socket.close();
          return;
        }
      }

      const sessionId = request.params.sessionId;
      fastify.log.info(`WebSocket connected for session: ${sessionId}`);

      let streamingContent = '';
      let activeSessionId = sessionId;
      let sessionReady = false;
      let userId = '';

      try {
        const existingSession = await sessionService.getSession(sessionId);
        if (existingSession) {
          activeSessionId = existingSession.id;
          sessionReady = true;
          userId = (existingSession as any).userId || '';
          fastify.log.info(`Using existing session: ${activeSessionId}`);
        } else {
          const sessionByProject = await sessionService.getSessionByProject(sessionId);
          if (sessionByProject) {
            activeSessionId = sessionByProject.id;
            sessionReady = true;
            userId = (sessionByProject as any).userId || '';
            fastify.log.info(`Found session ${activeSessionId} by projectId: ${sessionId}`);
          } else {
            fastify.log.warn(`Session not found for: ${sessionId}. Creating new session.`);
            const newSession = await sessionService.createSession({
              projectId: sessionId,
            });
            activeSessionId = newSession.id;
            sessionReady = true;
            userId = '';
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

      const notifyFrontend = (type: string, payload: any) => {
        socket.send(JSON.stringify({ type, ...payload }));
      };

      const getProviderConfig = async (userId: string): Promise<ProviderConfig> => {
        const fallback = getDefaultProviderConfig();

        if (!userId) {
          return fallback;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (!user?.apiKeys) {
            return fallback;
          }

          const config = user.apiKeys as unknown as SuperpowerConfig;

          if (!isValidSuperpowerConfig(config) || !config.selectedProvider || !config.providers?.length) {
            return fallback;
          }

          const selectedProvider = config.providers.find(
            (p) => p.id === config.selectedProvider
          );

          if (!selectedProvider) {
            return fallback;
          }

          const providerConfig: ProviderConfig = {
            type: mapProviderIdToType(selectedProvider.id),
            apiKey: selectedProvider.apiKey,
          };

          if (selectedProvider.apiEndpoint) {
            providerConfig.baseUrl = selectedProvider.apiEndpoint;
          }

          if (config.selectedModel) {
            providerConfig.model = config.selectedModel;
          }

          return providerConfig;
        } catch (err) {
          fastify.log.warn({ err }, 'Failed to load provider config from DB, using fallback');
          return fallback;
        }
      };

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

            if (!sessionManager.hasSession(activeSessionId)) {
              await sessionManager.createSession(
                userId || 'anonymous',
                activeSessionId,
                await getProviderConfig(userId),
                notifyFrontend,
                async (sid, fullText) => {
                  const content = fullText.trim();
                  if (!content) return;
                  try {
                    await sessionService.addMessage({
                      sessionId: sid,
                      uuid: crypto.randomUUID(),
                      type: 'assistant',
                      role: 'assistant',
                      content,
                    });
                  } catch (err) {
                    fastify.log.error({ err }, 'Failed to persist assistant message');
                  }
                }
              );
            }

            sessionManager.send(activeSessionId, {
              request: {
                session_id: activeSessionId,
                message: data.content,
                working_directory: sanitizeWorkingDirectory(activeSessionId),
              },
            });

          } else if (data.type === 'approve' && data.toolCallId) {
            fastify.log.info(`Tool approved: ${data.toolCallId}`);
            sessionManager.handleUserConfirm(data.toolCallId, true);

          } else if (data.type === 'reject' && data.toolCallId) {
            fastify.log.info(`Tool rejected: ${data.toolCallId}`);
            sessionManager.handleUserConfirm(data.toolCallId, false);

          } else if (isUserConfirmMessage(data)) {
            sessionManager.handleUserConfirm(data.promptId, data.approved);
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
        sessionManager.remove(activeSessionId);
        fastify.log.info(`WebSocket disconnected for session: ${sessionId}`);
      });

      socket.on('error', (error: Error) => {
        fastify.log.error({ err: error }, `WebSocket error for session ${sessionId}:`);
      });
    }
  );
}
