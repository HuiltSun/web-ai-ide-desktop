import { ChatStreamEvent } from '../types';
import { api } from './api';

const WS_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type MessageHandler = (event: ChatStreamEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private sessionId: string | null = null;

  connect(sessionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    this.sessionId = sessionId;
    const { Authorization: token } = api.getAuthHeaders();
    const tokenValue = token?.replace('Bearer ', '');
    const wsProtocol = WS_BASE.startsWith('https') ? 'wss' : 'ws';
    const wsBase = WS_BASE.replace(/^http/, wsProtocol);
    const wsUrl = tokenValue
      ? `${wsBase}/api/chat/${sessionId}/stream?token=${tokenValue}`
      : `${wsBase}/api/chat/${sessionId}/stream`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data: ChatStreamEvent = JSON.parse(event.data);
        this.handlers.forEach((handler) => handler(data));
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

  send(message: { type: string; content?: string; toolCallId?: string }) {
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

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
    this.handlers.clear();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSession() {
    return this.sessionId;
  }
}

export const wsService = new WebSocketService();
