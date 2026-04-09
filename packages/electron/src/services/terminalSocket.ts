import type { TerminalMessage, CreateSessionPayload, OutputPayload } from '@web-ai-ide/shared';

type MessageHandler = (message: TerminalMessage) => void;

export class TerminalSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor(url: string = `ws://${window.location.host}/ws/terminal`) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: TerminalMessage = JSON.parse(event.data);
            this.handlers.forEach((handler) => handler(message));
          } catch {
            console.error('Failed to parse message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            setTimeout(() => this.connect(), delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: TerminalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private off(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }

  createSession(payload: CreateSessionPayload, timeoutMs: number = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(handler);
        reject(new Error('Session creation timed out'));
      }, timeoutMs);

      const handler = (message: TerminalMessage) => {
        if (message.type === 'created' && message.sessionId) {
          clearTimeout(timer);
          resolve(message.sessionId);
          this.off(handler);
        } else if (message.type === 'error') {
          clearTimeout(timer);
          reject(new Error((message.payload as { error: string }).error));
          this.off(handler);
        }
      };

      this.onMessage(handler);
      this.send({ type: 'create', payload });
    });
  }

  write(sessionId: string, data: string): void {
    this.send({ type: 'input', sessionId, payload: { sessionId, data } });
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.send({ type: 'resize', sessionId, payload: { sessionId, cols, rows } });
  }

  kill(sessionId: string): void {
    this.send({ type: 'kill', sessionId, payload: { sessionId } });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
