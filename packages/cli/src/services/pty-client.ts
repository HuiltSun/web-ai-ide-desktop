const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_BASE.replace(/^http/, 'ws');

export interface PTYClientOptions {
  onOutput?: (data: string) => void;
  onExit?: (exitCode: number) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
}

export interface PTYClientConnectOptions {
  cols?: number;
  rows?: number;
}

export class PTYClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private options: PTYClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(options: PTYClientOptions = {}) {
    this.options = options;
  }

  connect(connectOptions: PTYClientConnectOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_URL}/ws/pty`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onConnect?.();
        this.ws?.send(
          JSON.stringify({
            type: 'create',
            payload: {
              cols: connectOptions.cols || 80,
              rows: connectOptions.rows || 24,
            },
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message, resolve, reject);
        } catch (error) {
          console.error('Failed to parse PTY message:', error);
        }
      };

      this.ws.onerror = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(connectOptions), 1000 * this.reconnectAttempts);
        } else {
          this.options.onError?.('Connection failed');
          reject(new Error('Failed to connect to PTY server'));
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  private handleMessage(
    message: any,
    resolve: (sessionId: string) => void,
    reject: (error: Error) => void
  ): void {
    switch (message.type) {
      case 'created':
        this.sessionId = message.sessionId;
        resolve(message.sessionId);
        break;

      case 'output':
        this.options.onOutput?.(message.payload.data);
        break;

      case 'exit':
        this.options.onExit?.(message.payload.exitCode);
        break;

      case 'error':
        this.options.onError?.(message.payload.error);
        if (!this.sessionId) {
          reject(new Error(message.payload.error));
        }
        break;
    }
  }

  write(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'input',
          payload: { sessionId: this.sessionId, data },
        })
      );
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'resize',
          payload: { sessionId: this.sessionId, cols, rows },
        })
      );
    }
  }

  disconnect(): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'kill',
          payload: { sessionId: this.sessionId },
        })
      );
    }
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSession(): string | null {
    return this.sessionId;
  }
}
