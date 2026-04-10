import { ChatStreamEvent } from '../types';
import { api } from './api';

const WS_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type MessageHandler = (event: ChatStreamEvent) => void;

interface PendingConfirmation {
  promptId: string;
  toolCallId?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private sessionId: string | null = null;
  private pendingConfirmation: PendingConfirmation | null = null;

  connect(sessionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    this.sessionId = sessionId;
    this.pendingConfirmation = null;
    const { Authorization: token } = api.getAuthHeaders();
    const tokenValue = token?.replace('Bearer ', '');
    const wsProtocol = WS_BASE.startsWith('https://') ? 'wss' : 'ws';
    const wsBase = WS_BASE.replace(/^https?:\/\//, `${wsProtocol}://`);
    const wsUrl = tokenValue
      ? `${wsBase}/api/chat/${sessionId}/stream?token=${tokenValue}`
      : `${wsBase}/api/chat/${sessionId}/stream`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const chatEvent: ChatStreamEvent = data;

        if (chatEvent.type === 'action_required' && 'promptId' in chatEvent && chatEvent.promptId) {
          this.pendingConfirmation = {
            promptId: chatEvent.promptId,
            toolCallId: 'toolCallId' in chatEvent ? chatEvent.toolCallId : undefined,
          };
        }

        this.handlers.forEach((handler) => handler(chatEvent));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.pendingConfirmation = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(message: { type: string; content?: string; toolCallId?: string }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendMessage(content: string) {
    this.send({ type: 'message', content });
  }

  approveTool(_toolCallId: string) {
    if (this.pendingConfirmation) {
      this.send({
        type: 'user_confirm',
        promptId: this.pendingConfirmation.promptId,
        approved: true,
      } as any);
      this.pendingConfirmation = null;
    }
  }

  rejectTool(_toolCallId: string) {
    if (this.pendingConfirmation) {
      this.send({
        type: 'user_confirm',
        promptId: this.pendingConfirmation.promptId,
        approved: false,
      } as any);
      this.pendingConfirmation = null;
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
    this.handlers.clear();
    this.pendingConfirmation = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSession() {
    return this.sessionId;
  }
}

export const wsService = new WebSocketService();