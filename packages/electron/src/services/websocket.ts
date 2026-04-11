import { ChatStreamEvent } from '../types';
import { api } from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function httpApiBaseToWsOrigin(apiBase: string): string {
  try {
    const normalized = apiBase.replace(/\/$/, '');
    const withScheme = /^https?:\/\//i.test(normalized) ? normalized : `http://${normalized}`;
    const u = new URL(withScheme);
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${u.host}`;
  } catch {
    return 'ws://localhost:3001';
  }
}

type MessageHandler = (event: ChatStreamEvent) => void;
type OpenHandler = () => void;

interface MessageMessage {
  type: 'message';
  content: string;
}

interface ApproveMessage {
  type: 'approve';
  toolCallId: string;
}

interface RejectMessage {
  type: 'reject';
  toolCallId: string;
}

type OutgoingMessage = MessageMessage | ApproveMessage | RejectMessage;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private sessionId: string | null = null;

  connect(sessionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    this.sessionId = sessionId;
    const origin = httpApiBaseToWsOrigin(API_BASE);
    const token = api.getAuthToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    this.ws = new WebSocket(`${origin}/api/chat/${sessionId}/stream${qs}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.openHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const chatEvent: ChatStreamEvent = data;
        this.handlers.forEach((handler) => handler(chatEvent));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private send(message: OutgoingMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendMessage(content: string) {
    this.send({ type: 'message', content });
  }

  approveTool(toolCallId: string) {
    this.send({ type: 'approve', toolCallId });
  }

  rejectTool(toolCallId: string) {
    this.send({ type: 'reject', toolCallId });
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onOpen(handler: OpenHandler) {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
    this.handlers.clear();
    this.openHandlers.clear();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSession() {
    return this.sessionId;
  }
}

export const wsService = new WebSocketService();