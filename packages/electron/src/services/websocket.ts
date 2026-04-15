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
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private manualClose: boolean = false;
  private readonly initialReconnectDelay: number = 1000;
  private readonly maxReconnectDelay: number = 30000;
  private closeHandlers: Set<OpenHandler> = new Set();

  connect(sessionId: string) {
    this.manualClose = false;
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
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
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
      this.closeHandlers.forEach((h) => h());
      this.scheduleReconnect();
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

  onClose(handler: OpenHandler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  private scheduleReconnect() {
    if (this.manualClose || !this.sessionId) return;

    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    ) + Math.random() * 500;

    this.reconnectAttempts++;
    console.log(`WebSocket reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.sessionId && !this.manualClose) {
        this.connect(this.sessionId);
      }
    }, delay);
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.handlers.clear();
    this.openHandlers.clear();
    this.closeHandlers.clear();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSession() {
    return this.sessionId;
  }
}

export const wsService = new WebSocketService();