import { FastifyInstance } from 'fastify';
import { sessionService } from '../services/session.service.js';

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

  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/stream',
    { websocket: true },
    (socket, request) => {
      const sessionId = request.params.sessionId;
      fastify.log.info(`WebSocket connected for session: ${sessionId}`);

      let streamingContent = '';

      socket.on('message', async (message) => {
        try {
          const data: ChatMessage = JSON.parse(message.toString());

          if (data.type === 'message' && data.content) {
            await sessionService.addMessage({
              sessionId,
              uuid: crypto.randomUUID(),
              type: 'user',
              role: 'user',
              content: data.content,
            });

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
          fastify.log.error('Error processing message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            content: 'Failed to process message',
          } as ChatStreamEvent));
        }
      });

      socket.on('close', () => {
        fastify.log.info(`WebSocket disconnected for session: ${sessionId}`);
      });

      socket.on('error', (error) => {
        fastify.log.error(`WebSocket error for session ${sessionId}:`, error);
      });
    }
  );
}