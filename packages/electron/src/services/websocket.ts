import { ChatStreamEvent } from '../types';

type MessageHandler = (event: ChatStreamEvent) => void;

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
  private sessionId: string | null = null;

  connect(sessionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    this.sessionId = sessionId;
    this.ws = new WebSocket(`ws://localhost:3001/api/chat/${sessionId}/stream`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
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