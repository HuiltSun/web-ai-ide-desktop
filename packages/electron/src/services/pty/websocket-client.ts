/**
 * WebSocket 客户端封装
 * 提供连接状态管理和事件监听功能
 */

export type WebSocketEventMap = {
  open: () => void;
  message: (data: string) => void;
  error: (error: Event) => void;
  close: (code: number, reason: string) => void;
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private eventListeners: Map<keyof WebSocketEventMap, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('open');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.emit('message', event.data);
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.emit('close', event.code, event.reason);
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      throw new Error('WebSocket 未连接');
    }
  }

  on<K extends keyof WebSocketEventMap>(event: K, callback: WebSocketEventMap[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as Function);
  }

  off<K extends keyof WebSocketEventMap>(event: K, callback: WebSocketEventMap[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as Function);
    }
  }

  private emit<K extends keyof WebSocketEventMap>(event: K, ...args: Parameters<WebSocketEventMap[K]>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  cleanup(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}
